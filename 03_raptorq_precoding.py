"""
================================================================================
EXAMPLE 3: RAPTORQ-STYLE PRECODING CONCEPT
================================================================================

This example demonstrates the key innovation of RaptorQ codes: precoding.
RaptorQ (RFC 6330) is an IETF standard fountain code used in applications
like 3GPP MBMS, DVB, and file delivery.

Key Concepts Demonstrated:
- Precoding: Adding redundant symbols before LT encoding
- LDPC-like structure for the precode
- How precoding enables recovery from small erasure fractions
- Composition: Precode + LT layer

================================================================================
"""

import numpy as np
import random
from collections import defaultdict

np.random.seed(42)
random.seed(42)

# =============================================================================
# PART 1: UNDERSTANDING THE PROBLEM
# =============================================================================

print("=" * 80)
print("FOUNTAIN CODES - EXAMPLE 3: RAPTORQ-STYLE PRECODING")
print("=" * 80)

print("""
THE PROBLEM WITH PURE LT CODES:

LT codes work well when you receive (1+ε)K symbols, but they have a weakness:
- If you receive slightly fewer than K symbols, decoding fails completely
- The failure is "cliff-like" - works at 1.05K, fails at 0.95K

RAPTORQ'S SOLUTION - PRECODING:

1. Take K source symbols
2. Add P redundant symbols using a precode (LDPC-like codes)
3. Now we have K+P "intermediate" symbols
4. Apply LT encoding to the K+P intermediate symbols
5. The precode allows recovery even if some LT symbols are lost

This creates a "soft" failure mode - graceful degradation.
""")

# =============================================================================
# PART 2: SIMPLE LDPC-LIKE PRECODE
# =============================================================================

print("=" * 80)
print("STEP 1: LDPC-LIKE PRECODE STRUCTURE")
print("=" * 80)

print("""
LDPC (Low-Density Parity-Check) codes are linear error-correcting codes.
They work by adding parity-check symbols that satisfy linear constraints.

For this demonstration, we'll use a simple structure:
- Source symbols: S[0], S[1], ..., S[K-1]
- Parity symbols: P[0], P[1], ..., P[P-1]
- Each parity symbol is XOR of a small subset of source symbols
""")

class SimplePrecode:
    """
    A simple LDPC-like precode for demonstration.
    
    Creates P redundant symbols from K source symbols.
    Each redundant symbol is XOR of a few randomly selected sources.
    """
    def __init__(self, K, P):
        """
        K: number of source symbols
        P: number of parity symbols to create
        """
        self.K = K
        self.P = P
        self.parity_neighbors = []  # Which sources each parity covers
        
        # Create parity-check structure
        # Each parity symbol covers ~3 random source symbols
        for i in range(P):
            # Select 3-5 source symbols for each parity
            degree = random.randint(3, 5)
            neighbors = sorted(random.sample(range(K), min(degree, K)))
            self.parity_neighbors.append(neighbors)
    
    def encode(self, source_symbols):
        """
        Create intermediate symbols = source + parity symbols.
        Returns array of K+P symbols.
        """
        intermediate = list(source_symbols)
        
        for neighbors in self.parity_neighbors:
            # XOR all source symbols in the neighborhood
            parity_val = 0
            for idx in neighbors:
                parity_val = np.bitwise_xor(parity_val, source_symbols[idx])
            intermediate.append(parity_val)
        
        return np.array(intermediate, dtype=np.uint8)
    
    def decode(self, received_intermediate):
        """
        Try to recover source symbols from received intermediate symbols.
        Some intermediate symbols may be None (erased).
        
        Uses iterative belief propagation on the parity-check structure.
        """
        symbols = list(received_intermediate)
        
        # Iteratively recover erased symbols
        changed = True
        iterations = 0
        max_iterations = 100
        
        while changed and iterations < max_iterations:
            changed = False
            iterations += 1
            
            # For each parity symbol, try to recover an unknown source
            for p_idx, neighbors in enumerate(self.parity_neighbors):
                parity_pos = self.K + p_idx
                
                # Skip if parity symbol itself is erased
                if symbols[parity_pos] is None:
                    continue
                
                # Count unknown sources for this parity
                unknown_indices = [n for n in neighbors if symbols[n] is None]
                
                if len(unknown_indices) == 1:
                    # Can recover this source!
                    unknown_idx = unknown_indices[0]
                    
                    # Unknown = Parity XOR (sum of known sources)
                    recovered_val = symbols[parity_pos]
                    for n in neighbors:
                        if n != unknown_idx and symbols[n] is not None:
                            recovered_val = np.bitwise_xor(recovered_val, symbols[n])
                    
                    symbols[unknown_idx] = recovered_val
                    changed = True
        
        return np.array(symbols[:self.K])  # Return only source symbols

# Parameters
K = 10  # Source symbols
P = 4   # Parity symbols (40% redundancy)

print("\nParameters:")
print(f"  K = {K} source symbols")
print(f"  P = {P} parity symbols")
print(f"  Precode rate = K/(K+P) = {K/(K+P)*100:.1f}%")

# Create precode
precode = SimplePrecode(K, P)

print("\n--- Parity-Check Structure ---")
for i, neighbors in enumerate(precode.parity_neighbors):
    print(f"  Parity P{i} = XOR of sources {neighbors}")

# Generate source symbols
source_symbols = np.random.randint(0, 256, size=K, dtype=np.uint8)
print(f"\nSource symbols: {source_symbols}")

# Encode with precode
intermediate = precode.encode(source_symbols)
print(f"\nIntermediate symbols (K+P = {K+P}):")
print(f"  Sources (positions 0-{K-1}): {intermediate[:K]}")
print(f"  Parities (positions {K}-{K+P-1}): {intermediate[K:]}")

# Verify parity equations
print("\n--- Verifying Parity Equations ---")
for i, neighbors in enumerate(precode.parity_neighbors):
    computed = 0
    for idx in neighbors:
        computed = np.bitwise_xor(computed, source_symbols[idx])
    expected = intermediate[K + i]
    match = "✓" if computed == expected else "✗"
    print(f"  P{i}: Computed={computed}, Expected={expected} {match}")

# =============================================================================
# PART 3: PRECODING RECOVERY DEMONSTRATION
# =============================================================================

print("\n" + "=" * 80)
print("STEP 2: PRECODING RECOVERY FROM ERASURES")
print("=" * 80)

def demonstrate_recovery(precode, intermediate, erase_count):
    """
    Demonstrate recovery when some intermediate symbols are erased.
    """
    K = precode.K
    P = precode.P
    
    # Create a copy with some symbols erased
    received = list(intermediate)
    erased_positions = random.sample(range(K + P), erase_count)
    
    for pos in erased_positions:
        received[pos] = None
    
    print(f"\n--- Erasing {erase_count} symbols ---")
    print(f"  Erased positions: {sorted(erased_positions)}")
    
    # Show which source symbols are directly available
    sources_available = sum(1 for i in range(K) if received[i] is not None)
    print(f"  Source symbols directly available: {sources_available}/{K}")
    
    # Try to decode
    recovered = precode.decode(received)
    
    # Check results
    success = all(r is not None for r in recovered)
    correct = all(recovered[i] == source_symbols[i] for i in range(K))
    
    if success and correct:
        print(f"  ✓ Successfully recovered all {K} source symbols!")
    elif success:
        print("  ⚠ All symbols recovered but some incorrect")
    else:
        unrecovered = sum(1 for r in recovered if r is None)
        print(f"  ✗ Failed to recover {unrecovered} source symbols")
    
    return success and correct

# Test with different numbers of erasures
print("\nTesting precode recovery with varying erasure counts:")
print("\nErasures | Success? | Notes")
print("-" * 50)

for erase_count in range(1, P + 2):
    success = demonstrate_recovery(precode, intermediate, erase_count)
    note = ""
    if erase_count <= P:
        note = "(within parity capacity)"
    else:
        note = "(exceeds parity capacity)"
    print(f"    {erase_count}    |    {'✓' if success else '✗'}     | {note}")

print("\n--- Key Insight ---")
print("The precode can recover up to P erased symbols (the parity count).")
print("This is because each parity provides one equation for recovery.")

# =============================================================================
# PART 4: LT LAYER ON TOP OF PRECODE
# =============================================================================

print("\n" + "=" * 80)
print("STEP 3: LT LAYER ON INTERMEDIATE SYMBOLS")
print("=" * 80)

print("""
RaptorQ combines precoding with LT encoding:

1. Source symbols → Precode → Intermediate symbols (K+P)
2. Intermediate symbols → LT encode → Unlimited encoding symbols

The LT layer uses the robust soliton distribution on the K+P intermediate
symbols instead of the original K source symbols.
""")

def robust_soliton(k, c=0.03, delta=0.5):
    """Robust Soliton distribution (from Example 2)."""
    rho = np.zeros(k + 1)
    rho[1] = 1.0 / k
    for i in range(2, k + 1):
        rho[i] = 1.0 / (i * (i - 1))
    
    R = c * np.log(k / delta) * np.sqrt(k)
    tau = np.zeros(k + 1)
    k_over_R = int(k / R)
    # Ensure we don't exceed array bounds
    k_over_R = min(k_over_R, k)
    
    for i in range(1, k_over_R):
        tau[i] = 1.0 / (i * k_over_R)
    
    if k_over_R <= k:
        tau[k_over_R] = np.log(R / delta) / k_over_R
    
    mu = rho + tau
    mu = mu / np.sum(mu)
    return mu

class RaptorQStyleEncoder:
    """
    Simplified RaptorQ-style encoder combining precode + LT.
    """
    def __init__(self, K, P):
        self.K = K
        self.P = P
        self.precode = SimplePrecode(K, P)
        self.degree_dist = robust_soliton(K + P, c=0.05, delta=0.5)
    
    def encode(self, source_symbols, num_encoding_symbols):
        """
        Full encoding: precode then LT encode.
        """
        # Step 1: Precode
        intermediate = self.precode.encode(source_symbols)
        
        # Step 2: LT encode intermediate symbols
        K_plus_P = self.K + self.P
        encoding_symbols = []
        
        for i in range(num_encoding_symbols):
            # Sample degree
            degree = np.random.choice(len(self.degree_dist), p=self.degree_dist)
            if degree == 0:
                degree = 1
            degree = min(degree, K_plus_P)
            
            # Select neighbors from intermediate symbols
            neighbors = sorted(random.sample(range(K_plus_P), degree))
            
            # XOR
            value = 0
            for idx in neighbors:
                value = np.bitwise_xor(value, int(intermediate[idx]))
            
            encoding_symbols.append({
                'id': i,
                'value': value,
                'neighbors': neighbors
            })
        
        return encoding_symbols

def raptorq_decode(encoding_symbols, K, P, precode, verbose=True):
    """
    RaptorQ-style decoding.
    
    Two-phase decoding:
    1. Use belief propagation to recover intermediate symbols
    2. Use precode to recover source symbols from intermediate
    """
    if verbose:
        print("\n--- RaptorQ-Style Decoding ---")
        print("Phase 1: Recover intermediate symbols via BP")
    
    K_plus_P = K + P
    
    # Phase 1: BP on intermediate symbols
    recovered_intermediate = [None] * K_plus_P
    recovered_count = 0
    
    # Create mutable symbol copies
    symbol_copies = []
    for es in encoding_symbols:
        symbol_copies.append({
            'value': es['value'],
            'neighbors': set(es['neighbors'])
        })
    
    # Index: intermediate symbol -> encoding symbols containing it
    int_to_symbols = defaultdict(list)
    for i, sym in enumerate(symbol_copies):
        for int_idx in sym['neighbors']:
            int_to_symbols[int_idx].append(i)
    
    iteration = 0
    while recovered_count < K_plus_P:
        iteration += 1
        
        # Find degree-1 symbols
        ripple = [sym for sym in symbol_copies if len(sym['neighbors']) == 1]
        
        if len(ripple) == 0:
            if verbose:
                print(f"  BP stalled after {iteration} iterations")
                print(f"  Recovered {recovered_count}/{K_plus_P} intermediate symbols")
            break
        
        # Process one degree-1 symbol
        sym = ripple[0]
        int_idx = list(sym['neighbors'])[0]
        int_value = sym['value']
        
        recovered_intermediate[int_idx] = int_value
        recovered_count += 1
        
        # Propagate
        for sym_idx in int_to_symbols[int_idx]:
            other_sym = symbol_copies[sym_idx]
            if int_idx in other_sym['neighbors']:
                other_sym['value'] = np.bitwise_xor(other_sym['value'], int_value)
                other_sym['neighbors'].remove(int_idx)
        
        sym['neighbors'].clear()
    
    if verbose:
        print(f"  Phase 1 complete: {recovered_count}/{K_plus_P} intermediate symbols")
    
    # Phase 2: Use precode to recover remaining source symbols
    if verbose:
        print("\nPhase 2: Use precode to recover source symbols")
    
    recovered_sources = precode.decode(recovered_intermediate)
    
    sources_recovered = sum(1 for r in recovered_sources if r is not None)
    if verbose:
        print(f"  Recovered {sources_recovered}/{K} source symbols")
    
    return recovered_sources

# Create encoder
raptorq = RaptorQStyleEncoder(K, P)

# Encode
num_encoding = int((K + P) * 1.2)  # 20% overhead
encoding_symbols = raptorq.encode(source_symbols, num_encoding)

print(f"\nGenerated {num_encoding} encoding symbols from {K+P} intermediate symbols")
print(f"  Overhead: {(num_encoding - (K+P)) / (K+P) * 100:.1f}%")

# Decode
recovered = raptorq_decode(encoding_symbols, K, P, raptorq.precode)

# Verify
if all(r is not None for r in recovered):
    matches = sum(1 for i in range(K) if recovered[i] == source_symbols[i])
    print(f"\n✓ Successfully decoded! {matches}/{K} symbols correct")

# =============================================================================
# PART 5: COMPARISON - WITH VS WITHOUT PRECODING
# =============================================================================

print("\n" + "=" * 80)
print("STEP 4: COMPARISON - WITH VS WITHOUT PRECODING")
print("=" * 80)

def pure_lt_encode(source_symbols, num_symbols, degree_dist):
    """Pure LT encoding (no precode)."""
    K = len(source_symbols)
    symbols = []
    
    for i in range(num_symbols):
        degree = np.random.choice(len(degree_dist), p=degree_dist)
        if degree == 0:
            degree = 1
        degree = min(degree, K)
        
        neighbors = sorted(random.sample(range(K), degree))
        value = 0
        for idx in neighbors:
            value = np.bitwise_xor(value, int(source_symbols[idx]))
        
        symbols.append({'id': i, 'value': value, 'neighbors': neighbors})
    
    return symbols

def pure_lt_decode(encoding_symbols, K, verbose=False):
    """Pure LT decoding (no precode)."""
    recovered = [None] * K
    recovered_count = 0
    
    symbol_copies = []
    for es in encoding_symbols:
        symbol_copies.append({
            'value': es['value'],
            'neighbors': set(es['neighbors'])
        })
    
    src_to_symbols = defaultdict(list)
    for i, sym in enumerate(symbol_copies):
        for src_idx in sym['neighbors']:
            src_to_symbols[src_idx].append(i)
    
    while recovered_count < K:
        ripple = [sym for sym in symbol_copies if len(sym['neighbors']) == 1]
        
        if len(ripple) == 0:
            return None
        
        sym = ripple[0]
        src_idx = list(sym['neighbors'])[0]
        src_value = sym['value']
        
        recovered[src_idx] = src_value
        recovered_count += 1
        
        for sym_idx in src_to_symbols[src_idx]:
            other_sym = symbol_copies[sym_idx]
            if src_idx in other_sym['neighbors']:
                other_sym['value'] = np.bitwise_xor(other_sym['value'], src_value)
                other_sym['neighbors'].remove(src_idx)
        
        sym['neighbors'].clear()
    
    return recovered

def compare_schemes(K, overhead, num_trials=20):
    """Compare pure LT vs RaptorQ-style with precode."""
    P = max(2, K // 5)  # 20% parity symbols
    
    pure_success = 0
    raptorq_success = 0
    
    for _ in range(num_trials):
        src = np.random.randint(0, 256, size=K, dtype=np.uint8)
        
        # Pure LT
        pure_dist = robust_soliton(K, c=0.05, delta=0.5)
        pure_enc = pure_lt_encode(src, int(K * (1 + overhead)), pure_dist)
        pure_rec = pure_lt_decode(pure_enc, K)
        if pure_rec is not None:
            pure_success += 1
        
        # RaptorQ-style
        raptorq = RaptorQStyleEncoder(K, P)
        raptorq_enc = raptorq.encode(src, int((K + P) * (1 + overhead)))
        raptorq_rec = raptorq_decode(raptorq_enc, K, P, raptorq.precode, verbose=False)
        if all(r is not None for r in raptorq_rec):
            raptorq_success += 1
    
    return pure_success / num_trials, raptorq_success / num_trials

print("\n--- Success Rate Comparison ---")
print(f"K = {K} source symbols")
print(f"P = {max(2, K//5)} parity symbols (RaptorQ only)")
print("\nOverhead | Pure LT | RaptorQ-Style | Improvement")
print("-" * 55)

for oh in [0.05, 0.10, 0.15, 0.20, 0.30]:
    pure_rate, raptorq_rate = compare_schemes(K, oh, num_trials=10)
    improvement = (raptorq_rate - pure_rate) * 100
    print(f"  {oh*100:4.0f}%   |  {pure_rate*100:5.1f}%  |    {raptorq_rate*100:5.1f}%    |  +{improvement:4.1f}%")

# =============================================================================
# PART 6: WHY PRECODING WORKS
# =============================================================================

print("\n" + "=" * 80)
print("STEP 5: WHY PRECODING WORKS")
print("=" * 80)

print("""
PRECODING PROVIDES TWO KEY BENEFITS:

1. GRACEFUL DEGRADATION:
   - Pure LT: Success is binary (all or nothing)
   - With precode: Can recover most symbols even with slight undersupply

2. REDUCED OVERHEAD:
   - Precode handles small erasure fractions efficiently
   - LT layer only needs to deliver ~90% of intermediate symbols
   - Overall overhead is reduced

THE MATHEMATICAL INTUITION:

Without precode:
  - Need K linearly independent equations to solve for K unknowns
  - BP fails if the equation graph has no degree-1 nodes

With precode:
  - Need K+P intermediate symbols to recover K source symbols
  - The P redundant symbols provide "slack" in the system
  - Can tolerate some missing intermediate symbols
  - Precode structure allows iterative recovery

RAPTORQ'S FULL STRUCTURE (simplified):

  Source Symbols (K)
        ↓
  [Precode: LDPC + HDPC]
        ↓
  Intermediate Symbols (K+P, P ≈ 0.05K to 0.1K)
        ↓
  [LT Encoding with Robust Soliton]
        ↓
  Encoding Symbols (unlimited, rateless)
""")

# Demonstrate the "slack" benefit
print("\n--- Demonstrating Slack Benefit ---")
print("What happens when we receive slightly fewer symbols than needed?")

K_test = 15
P_test = 3
src_test = np.random.randint(0, 256, size=K_test, dtype=np.uint8)

# Test with 95% of needed symbols
needed = K_test + P_test
received = int(needed * 0.95)

print(f"\nTest: K={K_test}, P={P_test}, need {needed}, receive {received} symbols (95%)")

# Pure LT
pure_dist = robust_soliton(K_test, c=0.05, delta=0.5)
pure_enc = pure_lt_encode(src_test, received, pure_dist)
pure_rec = pure_lt_decode(pure_enc, K_test)
print(f"  Pure LT: {'Success' if pure_rec else 'Failed'}")

# RaptorQ-style
raptorq_test = RaptorQStyleEncoder(K_test, P_test)
raptorq_enc = raptorq_test.encode(src_test, received)
raptorq_rec = raptorq_decode(raptorq_enc, K_test, P_test, raptorq_test.precode, verbose=False)
if raptorq_rec is not None:
    recovered_count = sum(1 for r in raptorq_rec if r is not None)
    print(f"  RaptorQ: Recovered {recovered_count}/{K_test} source symbols")

# =============================================================================
# SUMMARY
# =============================================================================

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print("""
Key Takeaways from RaptorQ-Style Precoding:

1. PRECODING ADDS REDUNDANCY:
   - Creates P redundant symbols from K source symbols
   - Uses LDPC-like parity-check structure
   - Enables recovery from small erasure fractions

2. TWO-LAYER ARCHITECTURE:
   - Layer 1: Precode (source → intermediate)
   - Layer 2: LT code (intermediate → encoding symbols)
   - Decoding is the reverse process

3. BENEFITS OF PRECODING:
   - Graceful degradation (not all-or-nothing)
   - Reduced overhead requirements
   - Better performance near the threshold

4. RAPTORQ (RFC 6330):
   - Uses systematic LDPC + HDPC precoding
   - Optimized degree distribution
   - Used in 3GPP, DVB, and other standards
   - Can recover from any K(1+ε) symbols with ε ≈ 5%

5. KEY EQUATION:
   - Intermediate symbols = K + P where P ≈ 0.05K to 0.10K
   - Need to receive ~K intermediate symbols to decode
   - Precode recovers remaining P from the received K
""")

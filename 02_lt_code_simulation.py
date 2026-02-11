"""
================================================================================
EXAMPLE 2: LT CODE SIMULATION
================================================================================

This example demonstrates Luby Transform (LT) codes, the first practical
fountain code. LT codes use:

1. Robust Soliton Distribution: A degree distribution optimized for efficient
decoding via belief propagation.

2. Belief Propagation Decoding: An iterative decoding algorithm that recovers
source symbols by finding encoding symbols with degree 1 (covering exactly one
unknown source).

Key Concepts Demonstrated:
- Robust Soliton degree distribution
- Random encoding with XOR operations
- Belief propagation decoding
- The "ripple" effect during decoding
- Success vs failure scenarios

================================================================================
"""

import numpy as np
import random
from collections import defaultdict

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

# =============================================================================
# PART 1: ROBUST SOLITON DISTRIBUTION
# =============================================================================

print("=" * 80)
print("FOUNTAIN CODES - EXAMPLE 2: LT CODE SIMULATION")
print("=" * 80)

print("\n" + "=" * 80)
print("STEP 1: ROBUST SOLITON DEGREE DISTRIBUTION")
print("=" * 80)

def ideal_soliton(k):
    """
    Ideal Soliton distribution for LT codes.
    
    The ideal soliton has:
    - P(degree=1) = 1/k
    - P(degree=i) = 1/(i*(i-1)) for i = 2, ..., k
    
    This distribution is theoretically optimal but fails in practice
    due to variance in the number of degree-1 symbols.
    """
    rho = np.zeros(k + 1)  # Index 0 unused, degrees 1 to k
    rho[1] = 1.0 / k
    for i in range(2, k + 1):
        rho[i] = 1.0 / (i * (i - 1))
    return rho

def robust_soliton(k, c=0.03, delta=0.5):
    """
    Robust Soliton distribution - the key innovation of LT codes.
    
    Parameters:
    - k: number of source symbols
    - c: constant affecting the ripple size (typically 0.02-0.05)
    - delta: failure probability bound (typically 0.5)
    
    The robust soliton adds a "ripple" component to ensure enough
    degree-1 symbols are available throughout decoding.
    
    Returns:
    - mu: probability distribution over degrees 1 to k
    """
    # Step 1: Compute Ideal Soliton rho
    rho = ideal_soliton(k)
    
    # Step 2: Compute additional component tau (the "ripple")
    # R = c * ln(k/delta) * sqrt(k) controls the ripple size
    R = c * np.log(k / delta) * np.sqrt(k)
    
    tau = np.zeros(k + 1)
    
    # tau(i) for i = 1 to floor(k/R) - 1
    k_over_R = int(k / R)
    # Ensure we don't exceed array bounds
    k_over_R = min(k_over_R, k)
    
    for i in range(1, k_over_R):
        tau[i] = 1.0 / (i * k_over_R)
    
    # tau at i = floor(k/R) (only if within bounds)
    if k_over_R <= k:
        tau[k_over_R] = np.log(R / delta) / k_over_R
    
    # Step 3: Normalize to get mu
    # mu = (rho + tau) / sum(rho + tau)
    mu = rho + tau
    mu = mu / np.sum(mu)
    
    return mu

def sample_degree(mu):
    """Sample a degree from the distribution mu."""
    degrees = np.arange(len(mu))
    return np.random.choice(degrees, p=mu)

# Parameters
K = 20  # Number of source symbols
C = 0.05  # Robust soliton parameter
delta = 0.5  # Failure probability bound

print("\nParameters:")
print(f"  K = {K} source symbols")
print(f"  c = {C} (robust soliton parameter)")
print(f"  delta = {delta} (failure probability bound)")

# Compute distributions
rho = ideal_soliton(K)
mu = robust_soliton(K, c=C, delta=delta)

print("\n--- Ideal Soliton Distribution (first 10 degrees) ---")
for i in range(1, min(11, K + 1)):
    print(f"  P(degree={i:2d}) = {rho[i]:.6f}")

print("\n--- Robust Soliton Distribution (first 10 degrees) ---")
for i in range(1, min(11, K + 1)):
    print(f"  P(degree={i:2d}) = {mu[i]:.6f}")

# Visualize the difference
print("\n--- Comparison (Ideal vs Robust) ---")
print("Degree | Ideal Soliton | Robust Soliton | Difference")
print("-" * 55)
for i in range(1, min(11, K + 1)):
    diff = mu[i] - rho[i]
    marker = " <-- Added ripple mass" if diff > 0.001 and i < 5 else ""
    print(f"  {i:2d}   |   {rho[i]:.6f}   |    {mu[i]:.6f}   | {diff:+.6f}{marker}")

print("\nNote: Robust soliton shifts probability mass toward lower degrees")
print("      This ensures more degree-1 symbols are available for decoding.")

# =============================================================================
# PART 2: ENCODING PROCESS
# =============================================================================

print("\n" + "=" * 80)
print("STEP 2: LT ENCODING PROCESS")
print("=" * 80)

# Generate source symbols (random data for demonstration)
source_symbols = np.random.randint(0, 256, size=K, dtype=np.uint8)
print(f"\nGenerated {K} source symbols (random byte values):")
print(f"  Source symbols: {source_symbols[:10]}... (showing first 10)")

class LTEncodingSymbol:
    """Represents an LT encoding symbol."""
    def __init__(self, symbol_id, value, neighbors):
        """
        symbol_id: unique identifier for this encoding symbol
        value: the XORed value of all source symbols in neighbors
        neighbors: list of source symbol indices this symbol covers
        """
        self.id = symbol_id
        self.value = value
        self.neighbors = neighbors  # Which source symbols were XORed
        self.degree = len(neighbors)
    
    def __repr__(self):
        return f"E{self.id}(deg={self.degree}, neighbors={self.neighbors})"

def lt_encode(source_symbols, num_encoding_symbols, degree_dist):
    """
    Generate LT encoding symbols.
    
    For each encoding symbol:
    1. Sample degree d from the robust soliton distribution
    2. Randomly select d distinct source symbols
    3. XOR them together to create the encoding symbol
    """
    K = len(source_symbols)
    encoding_symbols = []
    
    for i in range(num_encoding_symbols):
        # Sample degree
        degree = sample_degree(degree_dist)
        if degree == 0:
            degree = 1  # Ensure degree >= 1
        degree = min(degree, K)  # Cap at K
        
        # Select d distinct source symbols uniformly at random
        neighbors = sorted(random.sample(range(K), degree))
        
        # XOR the selected source symbols
        value = 0
        for idx in neighbors:
            value = np.bitwise_xor(value, source_symbols[idx])
        
        encoding_symbols.append(LTEncodingSymbol(i, value, neighbors))
    
    return encoding_symbols

# Generate encoding symbols
# We generate slightly more than K to ensure successful decoding
num_symbols = int(K * 1.3)  # 30% overhead
encoding_symbols = lt_encode(source_symbols, num_symbols, mu)

print(f"\nGenerated {num_symbols} encoding symbols (with {K} source symbols):")
print(f"  Overhead: {(num_symbols - K) / K * 100:.1f}%")

# Show degree distribution of generated symbols
degree_counts = defaultdict(int)
for es in encoding_symbols:
    degree_counts[es.degree] += 1

print("\n--- Degree Distribution in Generated Symbols ---")
print("Degree | Count | Percentage")
print("-" * 30)
for d in sorted(degree_counts.keys()):
    pct = degree_counts[d] / num_symbols * 100
    bar = "█" * int(pct / 2)
    print(f"  {d:2d}   |  {degree_counts[d]:3d}  |  {pct:5.1f}% {bar}")

# Show some example encoding symbols
print("\n--- Example Encoding Symbols ---")
for es in encoding_symbols[:5]:
    print(f"  {es}")
    print(f"    Value: {es.value}")
    # Verify: XOR the source symbols it claims to cover
    verify = 0
    for idx in es.neighbors:
        verify = np.bitwise_xor(verify, source_symbols[idx])
    print(f"    Verification: {'✓' if verify == es.value else '✗'}")

# =============================================================================
# PART 3: BELIEF PROPAGATION DECODING
# =============================================================================

print("\n" + "=" * 80)
print("STEP 3: BELIEF PROPAGATION DECODING")
print("=" * 80)

def belief_propagation_decode(encoding_symbols, K, verbose=True):
    """
    Decode LT codes using belief propagation.
    
    Algorithm:
    1. Find all degree-1 encoding symbols (cover exactly 1 unknown source)
    2. Recover the source symbol they cover
    3. XOR this source symbol out of all encoding symbols that contain it
    4. Repeat until all source symbols are recovered
    
    The "ripple" is the set of degree-1 symbols available at each step.
    """
    if verbose:
        print("\n--- Belief Propagation Decoding ---")
        print("Algorithm: Find degree-1 symbols, recover source, propagate")
    
    # Track recovered source symbols
    recovered = [None] * K  # None = unknown, value = recovered
    recovered_count = 0
    
    # Create a copy of encoding symbols with mutable neighbor sets
    # We use sets for O(1) removal
    symbol_copies = []
    for es in encoding_symbols:
        symbol_copies.append({
            'id': es.id,
            'value': es.value,
            'neighbors': set(es.neighbors),
            'original_neighbors': list(es.neighbors)
        })
    
    # Build index: source symbol -> list of encoding symbols containing it
    source_to_symbols = defaultdict(list)
    for i, sym in enumerate(symbol_copies):
        for src_idx in sym['neighbors']:
            source_to_symbols[src_idx].append(i)
    
    iteration = 0
    ripple_history = []
    
    while recovered_count < K:
        iteration += 1
        
        # Find all degree-1 symbols (the "ripple")
        ripple = [sym for sym in symbol_copies if len(sym['neighbors']) == 1]
        ripple_history.append(len(ripple))
        
        if verbose and iteration <= 10:
            print(f"\nIteration {iteration}: Ripple size = {len(ripple)}")
        elif verbose and iteration == 11:
            print(f"\n... (skipping iterations 11-{iteration-1}) ...")
        
        if len(ripple) == 0:
            if verbose:
                print("\n✗ DECODING FAILED!")
                print("  No degree-1 symbols available")
                print(f"  Recovered: {recovered_count}/{K} symbols")
            return None, ripple_history
        
        # Process one degree-1 symbol
        sym = ripple[0]
        source_idx = list(sym['neighbors'])[0]
        source_value = sym['value']
        
        # Recover this source symbol
        recovered[source_idx] = source_value
        recovered_count += 1
        
        if verbose and iteration <= 10:
            print(f"  Recovered S{source_idx} = {source_value}")
            print(f"  From encoding symbol E{sym['id']} (originally covered {sym['original_neighbors']})")
        
        # Remove this source from all encoding symbols that contain it
        # (XOR it out of their values and remove from neighbor sets)
        symbols_to_update = source_to_symbols[source_idx].copy()
        
        for sym_idx in symbols_to_update:
            other_sym = symbol_copies[sym_idx]
            if source_idx in other_sym['neighbors']:
                # XOR out the recovered source
                other_sym['value'] = np.bitwise_xor(other_sym['value'], source_value)
                other_sym['neighbors'].remove(source_idx)
        
        # Remove this symbol from consideration
        sym['neighbors'].clear()
    
    if verbose:
        print("\n✓ DECODING SUCCESS!")
        print(f"  All {K} source symbols recovered in {iteration} iterations")
    
    return recovered, ripple_history

# Run decoding
recovered, ripple = belief_propagation_decode(encoding_symbols, K)

# Verify decoding
if recovered is not None:
    print("\n--- Verification ---")
    matches = sum(1 for i in range(K) if recovered[i] == source_symbols[i])
    print(f"  Correctly recovered: {matches}/{K} symbols")
    if matches == K:
        print("  ✓ All symbols verified correct!")

# =============================================================================
# PART 4: THE RIPPLE EFFECT
# =============================================================================

print("\n" + "=" * 80)
print("STEP 4: THE RIPPLE EFFECT")
print("=" * 80)

print("\nThe 'ripple' is the set of degree-1 encoding symbols at each step.")
print("A healthy ripple ensures continuous decoding progress.")

print("\n--- Ripple Size Over Time ---")
print("Iteration | Ripple Size | Status")
print("-" * 40)
for i, size in enumerate(ripple[:20]):
    status = "✓" if size > 0 else "✗"
    bar = "●" * min(size, 20)
    print(f"    {i+1:3d}   |     {size:3d}     | {status} {bar}")

if len(ripple) > 20:
    print("    ...    |     ...     | ...")
    for i in range(len(ripple) - 5, len(ripple)):
        size = ripple[i]
        status = "✓" if size > 0 else "✗"
        bar = "●" * min(size, 20)
        print(f"    {i+1:3d}   |     {size:3d}     | {status} {bar}")

print("\n--- Ripple Statistics ---")
print(f"  Minimum ripple size: {min(ripple)}")
print(f"  Maximum ripple size: {max(ripple)}")
print(f"  Average ripple size: {np.mean(ripple):.2f}")

# =============================================================================
# PART 5: SUCCESS VS FAILURE SCENARIOS
# =============================================================================

print("\n" + "=" * 80)
print("STEP 5: SUCCESS VS FAILURE SCENARIOS")
print("=" * 80)

def simulate_decoding(K, overhead, num_trials=10):
    """
    Run multiple decoding trials with given overhead.
    Returns success rate.
    """
    successes = 0
    for trial in range(num_trials):
        # Generate new source symbols
        src = np.random.randint(0, 256, size=K, dtype=np.uint8)
        
        # Generate encoding symbols
        num_symbols = int(K * (1 + overhead))
        enc = lt_encode(src, num_symbols, mu)
        
        # Try to decode
        recovered, _ = belief_propagation_decode(enc, K, verbose=False)
        if recovered is not None:
            successes += 1
    
    return successes / num_trials

print("\n--- Success Rate vs Overhead ---")
print("Overhead | Symbols | Success Rate")
print("-" * 40)

overheads = [0.05, 0.10, 0.15, 0.20, 0.30, 0.50]
for oh in overheads:
    num_sym = int(K * (1 + oh))
    # Use fewer trials for speed
    success_rate = simulate_decoding(K, oh, num_trials=5)
    bar = "█" * int(success_rate * 20)
    print(f"  {oh*100:4.0f}%  |   {num_sym:3d}   |   {success_rate*100:5.1f}%  {bar}")

print("\n--- Demonstrating Failure Case ---")
print("Attempting to decode with only K symbols (0% overhead)...")

# Generate exactly K symbols
minimal_symbols = lt_encode(source_symbols, K, mu)
recovered_fail, ripple_fail = belief_propagation_decode(minimal_symbols, K, verbose=True)

print("\n--- Why It Fails ---")
print("With exactly K symbols:")
print("  1. The encoding matrix may not have full rank")
print("  2. Belief propagation may get stuck (no degree-1 symbols)")
print("  3. Gaussian elimination might still work, but BP is faster")
print("\nThe robust soliton distribution is designed so that")
print("with ~5-15% overhead, decoding succeeds with high probability.")

# =============================================================================
# PART 6: COMPARISON WITH IDEAL SOLITON
# =============================================================================

print("\n" + "=" * 80)
print("STEP 6: COMPARISON - IDEAL VS ROBUST SOLITON")
print("=" * 80)

print("\nLet's compare decoding success with Ideal vs Robust Soliton...")

def compare_distributions(K, overhead, num_trials=10):
    """Compare success rates of ideal vs robust soliton."""
    ideal_success = 0
    robust_success = 0
    
    for _ in range(num_trials):
        src = np.random.randint(0, 256, size=K, dtype=np.uint8)
        num_symbols = int(K * (1 + overhead))
        
        # Ideal soliton
        enc_ideal = lt_encode(src, num_symbols, ideal_soliton(K))
        rec_ideal, _ = belief_propagation_decode(enc_ideal, K, verbose=False)
        if rec_ideal is not None:
            ideal_success += 1
        
        # Robust soliton
        enc_robust = lt_encode(src, num_symbols, robust_soliton(K, c=C, delta=delta))
        rec_robust, _ = belief_propagation_decode(enc_robust, K, verbose=False)
        if rec_robust is not None:
            robust_success += 1
    
    return ideal_success / num_trials, robust_success / num_trials

print(f"\n--- Success Rate Comparison (K={K}, 20% overhead) ---")
ideal_rate, robust_rate = compare_distributions(K, 0.20, num_trials=10)
print(f"  Ideal Soliton:   {ideal_rate*100:5.1f}%")
print(f"  Robust Soliton:  {robust_rate*100:5.1f}%")
print("\nThe robust soliton significantly improves success rate!")

# =============================================================================
# SUMMARY
# =============================================================================

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print("""
Key Takeaways from LT Code Simulation:

1. ROBUST SOLITON DISTRIBUTION:
   - Adds extra probability mass to low degrees (especially degree 1)
   - Ensures a "ripple" of degree-1 symbols throughout decoding
   - Much more reliable than the ideal soliton in practice

2. ENCODING:
   - Each encoding symbol: sample degree d, select d random sources, XOR them
   - Rateless: can generate unlimited encoding symbols
   - No coordination needed between encoder and decoder

3. BELIEF PROPAGATION DECODING:
   - Iteratively find degree-1 symbols
   - Recover the single source they cover
   - XOR that source out of all symbols containing it
   - Repeat until all sources recovered

4. THE RIPPLE:
   - The set of degree-1 symbols available at each step
   - If ripple becomes empty, decoding fails
   - Robust soliton designed to keep ripple non-empty

5. OVERHEAD:
   - Need slightly more than K symbols to decode with high probability
   - Typical overhead: 5-15% for robust soliton
   - Trade-off: more overhead = higher success probability
""")

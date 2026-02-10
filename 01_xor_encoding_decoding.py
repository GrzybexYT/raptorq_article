"""
================================================================================
EXAMPLE 1: BASIC XOR ENCODING/DECODING
================================================================================

This example demonstrates the fundamental concept behind fountain codes:
encoding source symbols using XOR operations and decoding using Gaussian
elimination on a binary matrix.

Key Concepts Demonstrated:
- Source symbols encoded as XOR combinations
- Matrix representation of the encoding
- Gaussian elimination for decoding
- Handling rank-deficient matrices (insufficient symbols)

================================================================================
"""

import numpy as np

# =============================================================================
# PART 1: SETUP - Define Source Symbols
# =============================================================================

print("=" * 80)
print("FOUNTAIN CODES - EXAMPLE 1: BASIC XOR ENCODING/DECODING")
print("=" * 80)

# Define 4 source symbols as byte values (0-255)
# In practice, these would be chunks of a file
source_symbols = {
    'A': np.array([0b01000001], dtype=np.uint8),  # 'A' = 65
    'B': np.array([0b01000010], dtype=np.uint8),  # 'B' = 66
    'C': np.array([0b01000011], dtype=np.uint8),  # 'C' = 67
    'D': np.array([0b01000100], dtype=np.uint8),  # 'D' = 68
}

print("\n" + "=" * 80)
print("STEP 1: SOURCE SYMBOLS")
print("=" * 80)
print("\nWe have 4 source symbols (A, B, C, D) with byte values:")
for name, value in source_symbols.items():
    print(f"  {name} = {value[0]:3d} = 0b{value[0]:08b}")

# =============================================================================
# PART 2: ENCODING - Create Encoding Symbols as XOR Combinations
# =============================================================================

print("\n" + "=" * 80)
print("STEP 2: ENCODING - Creating Encoding Symbols via XOR")
print("=" * 80)

# Encoding symbols are created by XORing source symbols together
# Each encoding symbol has an "encoding vector" showing which sources it contains

# Define encoding symbols with their composition
encoding_symbols = []
encoding_vectors = []

# E1 = A XOR B (encoding vector: [1, 1, 0, 0])
e1 = np.bitwise_xor(source_symbols['A'], source_symbols['B'])
encoding_symbols.append(('E1 = A XOR B', e1, [1, 1, 0, 0]))

# E2 = B XOR C XOR D (encoding vector: [0, 1, 1, 1])
e2 = np.bitwise_xor(np.bitwise_xor(source_symbols['B'], source_symbols['C']), source_symbols['D'])
encoding_symbols.append(('E2 = B XOR C XOR D', e2, [0, 1, 1, 1]))

# E3 = A XOR C (encoding vector: [1, 0, 1, 0])
e3 = np.bitwise_xor(source_symbols['A'], source_symbols['C'])
encoding_symbols.append(('E3 = A XOR C', e3, [1, 0, 1, 0]))

# E4 = A XOR B XOR D (encoding vector: [1, 1, 0, 1])
e4 = np.bitwise_xor(np.bitwise_xor(source_symbols['A'], source_symbols['B']), source_symbols['D'])
encoding_symbols.append(('E4 = A XOR B XOR D', e4, [1, 1, 0, 1]))

print("\nEncoding symbols are created by XORing source symbols:")
for name, value, vector in encoding_symbols:
    print(f"\n  {name}")
    print(f"    Value: {value[0]:3d} = 0b{value[0]:08b}")
    print(f"    Encoding vector: {vector}")

# =============================================================================
# PART 3: MATRIX REPRESENTATION
# =============================================================================

print("\n" + "=" * 80)
print("STEP 3: MATRIX REPRESENTATION")
print("=" * 80)

# Build the encoding matrix (each row is an encoding vector)
encoding_matrix = np.array([vector for _, _, vector in encoding_symbols], dtype=np.uint8)

print("\nThe encoding can be represented as a matrix equation:")
print("  E = G × S")
print("\nWhere:")
print("  E = vector of encoding symbols (what we receive)")
print("  G = generator/encoding matrix (below)")
print("  S = vector of source symbols (what we want to recover)")

print("\nEncoding Matrix G (4×4):")
print("  Each row shows which source symbols are XORed together")
print("  Columns: [A, B, C, D]")
print()
print("      A  B  C  D")
for i, (name, _, vector) in enumerate(encoding_symbols):
    row_str = "  ".join(f"{v:2d}" for v in vector)
    print(f"  {name[:2]} [{row_str}]")

print("\nIn matrix form:")
print(encoding_matrix)

# =============================================================================
# PART 4: DECODING WITH GAUSSIAN ELIMINATION
# =============================================================================

print("\n" + "=" * 80)
print("STEP 4: DECODING USING GAUSSIAN ELIMINATION")
print("=" * 80)

print("\nTo decode, we need to solve: G × S = E")
print("We use Gaussian elimination on the augmented matrix [G | E]")

# Create augmented matrix [encoding_matrix | encoding_values]
encoding_values = np.array([e[1][0] for e in encoding_symbols], dtype=np.uint8)
augmented = np.column_stack([encoding_matrix, encoding_values])

print("\nAugmented Matrix [G | E]:")
print("  (Last column is the encoding symbol value)")
print(augmented)

# Perform Gaussian elimination over GF(2) (binary field)
def gaussian_elimination_gf2(aug_matrix):
    """
    Perform Gaussian elimination over GF(2) (binary field).
    In GF(2): addition = XOR, multiplication = AND
    """
    matrix = aug_matrix.copy().astype(np.uint8)
    rows, cols = matrix.shape
    num_vars = cols - 1  # Last column is the RHS
    
    row = 0
    pivot_cols = []
    
    print("\n--- Gaussian Elimination Steps (GF(2)) ---")
    
    for col in range(num_vars):
        # Find pivot row (first row with 1 in current column, at or below current row)
        pivot = None
        for r in range(row, rows):
            if matrix[r, col] == 1:
                pivot = r
                break
        
        if pivot is None:
            print(f"\nColumn {col}: No pivot found (column is all zeros below row {row})")
            continue
        
        # Swap rows if necessary
        if pivot != row:
            print(f"\nColumn {col}: Swap row {row} with row {pivot}")
            matrix[[row, pivot]] = matrix[[pivot, row]]
            print(f"  After swap:\n{matrix}")
        else:
            print(f"\nColumn {col}: Pivot at row {row}")
        
        pivot_cols.append(col)
        
        # Eliminate all other 1s in this column (both above and below for RREF)
        for r in range(rows):
            if r != row and matrix[r, col] == 1:
                print(f"  Row {r} = Row {r} XOR Row {row}")
                matrix[r] = np.bitwise_xor(matrix[r], matrix[row])
                print(f"  After elimination:\n{matrix}")
        
        row += 1
        if row >= rows:
            break
    
    return matrix, pivot_cols

reduced_matrix, pivots = gaussian_elimination_gf2(augmented)

print("\n--- Final Reduced Row Echelon Form ---")
print(reduced_matrix)

print(f"\nPivot columns: {pivots}")
print(f"Matrix rank: {len(pivots)}")

# Extract solution
if len(pivots) == 4:
    print("\n✓ Full rank! All source symbols can be recovered.")
    solution = reduced_matrix[:, -1]
    print("\nRecovered source symbols:")
    source_names = ['A', 'B', 'C', 'D']
    for i, name in enumerate(source_names):
        print(f"  {name} = {solution[i]:3d} = 0b{solution[i]:08b}")
    
    # Verify
    print("\nVerification:")
    for name in source_names:
        original = source_symbols[name][0]
        recovered = solution[source_names.index(name)]
        match = "✓" if original == recovered else "✗"
        print(f"  {name}: Original={original}, Recovered={recovered} {match}")
else:
    print(f"\n✗ Rank deficient! Only {len(pivots)} symbols can be recovered.")

# =============================================================================
# PART 5: RANK-DEFICIENT EXAMPLE
# =============================================================================

print("\n" + "=" * 80)
print("STEP 5: RANK-DEFICIENT MATRIX EXAMPLE")
print("=" * 80)

print("\nWhat happens if we receive only 3 linearly dependent symbols?")

# Create a rank-deficient scenario (only 3 symbols, one is linear combination)
limited_symbols = [
    ('E1 = A XOR B', encoding_symbols[0][1], [1, 1, 0, 0]),
    ('E2 = B XOR C XOR D', encoding_symbols[1][1], [0, 1, 1, 1]),
    # E5 is E1 XOR E2 (linearly dependent!)
    ('E5 = E1 XOR E2 = A XOR C XOR D', 
     np.bitwise_xor(encoding_symbols[0][1], encoding_symbols[1][1]),
     [1, 0, 1, 1])  # This equals [1,1,0,0] XOR [0,1,1,1] = [1,0,1,1]
]

print("\nReceiving only 3 symbols (E1, E2, and E5=E1 XOR E2):")
for name, value, vector in limited_symbols:
    print(f"  {name}: vector={vector}")

limited_matrix = np.array([vector for _, _, vector in limited_symbols])
limited_values = np.array([e[1][0] for e in limited_symbols])
limited_augmented = np.column_stack([limited_matrix, limited_values])

print("\nAugmented matrix (3×5):")
print(limited_augmented)

reduced_limited, pivots_limited = gaussian_elimination_gf2(limited_augmented)

print("\n--- Analysis ---")
print(f"Matrix rank: {len(pivots_limited)} (need 4 for full recovery)")
print("\nThis demonstrates a key fountain code property:")
print("  • We need at least K LINEARLY INDEPENDENT symbols to recover K sources")
print("  • The encoding matrix must have full rank (rank = K)")
print("  • In practice, we receive slightly more than K symbols to ensure full rank")

# =============================================================================
# PART 6: OVER-COMPLETE EXAMPLE (More symbols than needed)
# =============================================================================

print("\n" + "=" * 80)
print("STEP 6: OVER-COMPLETE EXAMPLE (5 symbols for 4 sources)")
print("=" * 80)

print("\nFountain codes are rateless - we can keep receiving symbols!")
print("Let's add a 5th symbol and show we can still decode.")

# Add E5 = C XOR D
e5 = np.bitwise_xor(source_symbols['C'], source_symbols['D'])
extra_symbols = encoding_symbols + [('E5 = C XOR D', e5, [0, 0, 1, 1])]

extra_matrix = np.array([vector for _, _, vector in extra_symbols])
extra_values = np.array([e[1][0] for e in extra_symbols])
extra_augmented = np.column_stack([extra_matrix, extra_values])

print("\nWith 5 symbols (4×5 matrix, over-complete system):")
print("  We can choose any 4 linearly independent rows")

# For demonstration, use first 4 rows
selected = extra_augmented[:4, :]
print("\nUsing first 4 symbols:")
reduced_extra, pivots_extra = gaussian_elimination_gf2(selected)

if len(pivots_extra) == 4:
    print("\n✓ Successfully decoded with first 4 symbols!")
else:
    print("\nFirst 4 symbols are dependent, trying different combination...")
    # Try rows 0, 1, 2, 4 (skip E4)
    selected = extra_augmented[[0, 1, 2, 4], :]
    reduced_extra, pivots_extra = gaussian_elimination_gf2(selected)

# =============================================================================
# SUMMARY
# =============================================================================

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print("""
Key Takeaways from XOR Encoding/Decoding:

1. ENCODING:
   - Source symbols are combined using XOR operations
   - Each encoding symbol has an encoding vector (which sources it contains)
   - The encoding matrix G has encoding vectors as rows

2. DECODING:
   - Solve the linear system: G × S = E
   - Use Gaussian elimination over GF(2)
   - Need the encoding matrix to have full rank (rank = K)

3. RANK REQUIREMENT:
   - Must receive at least K linearly independent symbols
   - Linear dependence means some symbols don't add new information
   - Fountain codes generate more symbols than needed to ensure success

4. FOUNTAIN PROPERTY:
   - Can receive any subset of encoding symbols
   - Don't need specific symbols, just enough independent ones
   - This is the "fountain" - keep generating until receiver has enough
""")

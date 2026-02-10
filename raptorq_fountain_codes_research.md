# RaptorQ and Fountain Codes: History and Technical Details

## 1. History of Fountain Codes

### 1.1 The Digital Fountain Concept (1998)
The foundational concept of a "digital fountain" was introduced in 1998 by **John Byers, Michael Luby, Michael Mitzenmacher, and Ashutosh Rege** in their seminal work on scalable protocols for bulk data transfer to heterogeneous clients without requiring feedback channels.

**Key Paper:**
- Byers, J., Luby, M., Mitzenmacher, M., & Rege, A. (1998). "A digital fountain approach to reliable distribution of bulk data." Proceedings of ACM SIGCOMM '98, Vancouver, BC, Canada, pp. 56-67.

### 1.2 Tornado Codes (1997)
Tornado codes, developed by **Michael Luby, Michael Mitzenmacher, Amin Shokrollahi, Daniel Spielman, and Volker Stemann** in 1997, represented an early sparse-graph approach to erasure codes but had limitations in overhead for small block sizes.

**Key Paper:**
- Luby, M., Mitzenmacher, M., Shokrollahi, A., Spielman, D., & Stemann, V. (1997). "Practical Loss-Resilient Codes." Proceedings of the 29th Annual ACM Symposium on Theory of Computing (STOC), pp. 150-159.

### 1.3 LT Codes - Luby Transform Codes (2002)
**Inventor:** Michael Luby  
**Year:** 2002  
**Company:** Digital Fountain, Inc. (founded by Michael Luby and Jay Goldin in 1998)

LT codes were the **first practical realization of fountain codes**, providing efficient belief-propagation decoding with an average overhead of about 5% for large k (e.g., k ≈ 10,000).

**Key Paper:**
- Luby, M. (2002). "LT Codes." Proceedings of the 43rd Annual IEEE Symposium on Foundations of Computer Science (FOCS), Vancouver, BC, Canada, November 2002, pp. 271-280.  
  **DOI:** 10.1109/SFCS.2002.1181950

### 1.4 Raptor Codes (2006)
**Inventor:** Amin Shokrollahi  
**Year:** 2006  
**Institution:** EPFL (Swiss Federal Institute of Technology)

Raptor codes extended LT codes through a precode-LT concatenation to achieve truly **linear-time encoding and decoding** while reducing overhead to under 2% and improving failure probabilities.

**Key Paper:**
- Shokrollahi, A. (2006). "Raptor Codes." IEEE Transactions on Information Theory, Vol. 52, No. 6, June 2006, pp. 2551-2567.  
  **DOI:** 10.1109/TIT.2006.874390

### 1.5 RaptorQ Codes (2011)
**Inventors:** Michael Luby, Amin Shokrollahi, Mark Watson, Thomas Stockhammer, Lorenz Minder  
**Specification:** IETF RFC 6330, August 2011  
**FEC Encoding ID:** 6

RaptorQ is the most advanced version of Raptor codes, providing superior flexibility, support for larger source block sizes, and better coding efficiency than Raptor codes in RFC 5053.

---

## 2. RFC 6330 - RaptorQ Specification

### 2.1 Overview
RFC 6330 specifies a **Fully-Specified Forward Error Correction (FEC) scheme** for the RaptorQ FEC code and its application to reliable delivery of data objects.

**Document Details:**
- **Title:** RaptorQ Forward Error Correction Scheme for Object Delivery
- **Authors:** M. Luby (Qualcomm), A. Shokrollahi (EPFL), M. Watson (Netflix), T. Stockhammer (Nomor Research), L. Minder (Qualcomm)
- **Date:** August 2011
- **Status:** Internet Standards Track
- **DOI:** 10.17487/RFC6330

### 2.2 Key Capabilities
- **Fountain code:** As many encoding symbols as needed can be generated on the fly
- **Systematic code:** All source symbols are among the encoding symbols that can be generated
- **Maximum source symbols:** K'_max = 56,403 source symbols per source block
- **Repair symbols:** Can support up to 2 billion repair packets
- **Recovery probability:** 
  - K received symbols: 99% success probability
  - K+1 received symbols: 99.99% success probability
  - K+2 received symbols: 99.9999% success probability

---

## 3. Technical Details of RaptorQ

### 3.1 Finite Field Usage - GF(256) vs GF(2)

RaptorQ uses a **mixed finite field approach**:

| Component | Finite Field | Description |
|-----------|--------------|-------------|
| HDPC symbols | GF(256) | High Density Parity Check symbols use 8-bit field elements |
| LDPC symbols | GF(2) | Low Density Parity Check symbols use binary operations |
| LT symbols | GF(2) | Luby Transform symbols use binary XOR operations |

**Key advantage:** Using GF(256) for HDPC symbols improves the failure probability curve without causing large performance penalties, as only a small subset of symbols use the larger field.

### 3.2 Degree Distribution (Table 1 from RFC 6330)

The degree distribution defines the probability of selecting each degree for encoding symbols:

| Index d | f[d] | Index d | f[d] |
|---------|------|---------|------|
| 0 | 0 | 1 | 5,243 |
| 2 | 529,531 | 3 | 704,294 |
| 4 | 791,675 | 5 | 844,104 |
| 6 | 879,057 | 7 | 904,023 |
| 8 | 922,747 | 9 | 937,311 |
| 10 | 948,962 | 11 | 958,494 |
| 12 | 966,438 | 13 | 973,160 |
| 14 | 978,921 | 15 | 983,914 |
| 16 | 988,283 | 17 | 992,138 |
| 18 | 995,565 | 19 | 998,631 |
| 20 | 1,001,391 | 21 | 1,003,887 |
| 22 | 1,006,157 | 23 | 1,008,229 |
| 24 | 1,010,129 | 25 | 1,011,876 |
| 26 | 1,013,490 | 27 | 1,014,983 |
| 28 | 1,016,370 | 29 | 1,017,662 |
| 30 | 1,048,576 | | |

**Note:** f[d] values are cumulative thresholds out of 2^20 = 1,048,576. To get the actual probability of degree d, compute: (f[d] - f[d-1]) / 2^20

### 3.3 Expected Degree Values

The RaptorQ degree distribution has the following expected values:

| Component | Expected Degree |
|-----------|-----------------|
| LT part (Ω distribution) | ~4.82 |
| PI part (Π distribution) | ~2.34 |
| **Total expected degree** | **~7.15** |

### 3.4 Precode Structure (LDPC + HDPC Symbols)

The RaptorQ precode consists of two components:

#### 3.4.1 LDPC Symbols (Low Density Parity Check)
- Generated from a **cyclically shifted circulant matrix**
- Each LDPC symbol has a pre-coding relationship with a **small fraction** of other intermediate symbols
- Number of LDPC symbols: S(K') - varies by source block size (prime number)
- Example values: S = 7, 11, 13, 17, 23, 127, 131, 137, 139, 149, etc.

#### 3.4.2 HDPC Symbols (High Density Parity Check)
- Dense form of parity-check code
- Each HDPC symbol has a pre-coding relationship with a **large fraction** of other intermediate symbols
- Number of HDPC symbols: H(K') - typically small
- Standard values: H = 10 for most K', increasing to 11, 13, 14, 15 for larger blocks
- HDPC elements are chosen from **GF(256)**

#### 3.4.3 Generator Matrix Structure
```
+----------------------------------+
| H rows: HDPC codes (dense)       |
| S rows: LDPC codes (sparse)      |
| K' rows: LT codes (sparse)       |
+----------------------------------+
          L intermediate symbols
```

Where L = S + H + K' (total intermediate symbols)

### 3.5 Inactivation Decoding

Inactivation decoding is a hybrid approach combining **belief propagation** and **Gaussian elimination**:

#### Phase 1: Triangulation (Belief Propagation)
- Identify encoded symbols with exactly one unrecovered neighbor
- Mark the neighbor as "resolvable"
- When belief propagation gets stuck (ripple is empty), mark an intermediate symbol as **inactive**
- Continue until all symbols are either resolved or inactivated

#### Phase 2: Gaussian Elimination
- Solve for the inactivated symbols using Gaussian elimination
- Matrix size: M × M where M is the number of inactivated symbols
- Complexity: O(M³) bit operations + O(M²) symbol operations

#### Phase 3: Back-Substitution
- Use solved inactivated symbols to recover remaining symbols
- Apply belief propagation with known values

#### Permanent Inactivation (RaptorQ Enhancement)
- Approximately **√K** intermediate symbols are declared **permanently inactive** (PI symbols)
- PI symbols are inactivated at the start of decoding
- Remaining symbols are LT symbols
- This dramatically improves recovery properties while maintaining linear time complexity

---

## 4. Comparison with Other Erasure Codes

### 4.1 RaptorQ vs Reed-Solomon

| Property | Reed-Solomon | RaptorQ |
|----------|--------------|---------|
| **Complexity** | O(k²) quadratic | O(k) linear |
| **Max source symbols** | 255 (GF(256)) | 56,403 |
| **Rate** | Fixed | Rateless (fountain) |
| **Overhead** | Zero (MDS) | <1% (near-optimal) |
| **Encoding workload** | ~k×(n-k)×4 XORs/symbol | ~4.5+7.5×(k/n) XORs/symbol |
| **Decoding workload** | ~(n-k)×4 XORs/symbol | ~10+4.5×min(n-k,k)/k XORs/symbol |
| **Flexibility** | Must choose n, k in advance | Generate symbols on demand |

### 4.2 RaptorQ vs Turbo Codes

| Property | Turbo Codes | RaptorQ |
|----------|-------------|---------|
| **Primary use** | Error correction (AWGN) | Erasure correction (packet loss) |
| **Decoding** | Iterative soft-decision | Inactivation decoding |
| **Complexity** | High iterative complexity | Linear encoding/decoding |
| **Application** | Physical layer | Application layer (AL-FEC) |

### 4.3 RaptorQ vs LDPC Codes

| Property | LDPC | RaptorQ |
|----------|------|---------|
| **Rate** | Typically fixed | Rateless (fountain) |
| **Structure** | Sparse parity-check matrix | Precode + LT concatenation |
| **Decoding** | Belief propagation | Inactivation decoding |
| **Overhead** | Higher overhead | Essentially zero overhead |
| **Block size** | Limited | Up to 56,403 symbols |

---

## 5. Real-World Applications of RaptorQ

### 5.1 3GPP MBMS (Multimedia Broadcast/Multicast Services)
- **Standard:** 3GPP TS 26.346
- **Use:** Enhanced multimedia broadcast and multicast services (eMBMS) in LTE
- **Benefit:** Efficient delivery of multimedia content to multiple mobile users
- **Deployment:** Both download delivery (files) and streaming delivery (real-time video)

### 5.2 ATSC 3.0 (Next Gen TV)
- **Standard:** ATSC A/331 "Signaling, Delivery, Synchronization, and Error Protection"
- **Use:** High-quality broadcast video streaming and efficient file delivery (datacasting)
- **Benefit:** Robust mobile TV reception, broadcast internet enabling general data delivery

### 5.3 DVB (Digital Video Broadcasting)
- **Standard:** DVB-H IP Datacasting specifications
- **Use:** Mobile multimedia broadcasting
- **Integration:** Combined with physical layer FEC for enhanced reliability

### 5.4 Netflix Streaming
- **Application:** Low latency/high reliability streaming video
- **Implementation:** ROUTE protocol with RaptorQ for packet loss protection
- **Open Source:** RqRouteDemo and TvRQ implementations available

### 5.5 Other Applications
- **File delivery:** Large file distribution over lossy networks
- **Peer-to-peer systems:** BitTorrent-like content distribution
- **Satellite communications:** Reliable data transmission over satellite links
- **Military communications:** Robust communication in adverse conditions
- **Distributed storage:** Data redundancy in cloud storage systems

---

## 6. Key References

### Foundational Papers
1. Luby, M. (2002). "LT Codes." FOCS 2002. DOI: 10.1109/SFCS.2002.1181950
2. Shokrollahi, A. (2006). "Raptor Codes." IEEE Trans. IT, 52(6):2551-2567. DOI: 10.1109/TIT.2006.874390
3. Luby, M., et al. (2011). "RaptorQ Forward Error Correction Scheme for Object Delivery." RFC 6330. DOI: 10.17487/RFC6330

### Standards Documents
- IETF RFC 5052: FEC Building Block
- IETF RFC 5053: Raptor FEC Scheme (predecessor to RaptorQ)
- IETF RFC 6330: RaptorQ FEC Scheme
- 3GPP TS 26.346: MBMS Protocols and Codecs
- ATSC A/331: Signaling, Delivery, Synchronization, and Error Protection

### Technical Overviews
- Qualcomm. "RaptorQ Technical Overview"
- Qualcomm. "Why DF Raptor is Better Than Reed-Solomon for Streaming Applications"
- Digital Fountain (acquired by Qualcomm in 2009)

---

*Research compiled from IETF RFC 6330, IEEE publications, and industry technical documentation.*

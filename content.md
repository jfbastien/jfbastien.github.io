---
name: JF Bastien
tagline: build & scale platforms
url: https://jfbastien.com
email: me@jfbastien.com
description: Systems and compiler engineer building and scaling platforms.
social:
  - icon: "\U0001F4E7"
    label: me@jfbastien.com
    url: mailto:me@jfbastien.com
    rel: me
  - icon: "\U0001D54F"
    label: "@jfbastien"
    url: https://x.com/jfbastien
  - icon: "\U0001F418"
    label: "@jfbastien@mastodon.social"
    url: https://mastodon.social/@jfbastien
    rel: me
  - icon: "\U0001F98B"
    label: "@jfbastien.com"
    url: https://bsky.app/profile/jfbastien.com
  - icon: "\U0001F419"
    label: jfbastien
    url: https://github.com/jfbastien
og:
  image: https://jfbastien.com/og.png
  width: 1200
  height: 630
twitter:
  site: "@jfbastien"
---

## About Me

Systems and compiler engineer building and scaling platforms: security engineering, standardization, open source. Chair of the [C++ Language Evolution Working Group](https://isocpp.org/std/the-committee); former chair of the [WebAssembly](https://en.wikipedia.org/wiki/WebAssembly) community group. At the hardware/software boundary, from silicon-aware optimization to user-facing platforms.

## Work Experience

### Stealth Physical Systems Startup
> VP, Software Platform
> 2025-06/present

Crafting a platform where code drives the physical world.

### Woven by Toyota
> Distinguished Engineer
> 2020-08/2025-06

Safety-critical software platform driving Toyota’s transformation to a software-first mobility company.
- Foundational safety software infrastructure for vehicle development: design, team building, scaling.
- Hardware/software co-design strategy across the electrical and electronic supply chain.
- Safety qualification of software toolchains; OEM-controlled development environments across C/C++/Rust.
- Toyota’s Rust adoption for safety-critical systems; founding of the [Safety-Critical Rust Consortium](https://rustfoundation.org/media/announcing-the-safety-critical-rust-consortium/).
- Platform security program for emerging automotive cybersecurity regulations.
- Chair of C++ language evolution: contracts, reflection; safety & security team for C and [MISRA](https://misra.org.uk/).
- Toyota’s open-source strategy, with the Open Source Program Office.
- VP and executive: organizational scaling, startup → production-oriented change agent for Toyota Group.

### Apple
> Compiler Engineer
> 2016-08/2020-08

Security through compiler technology.
- C++ lead and compiler engineer on the [LLVM](https://llvm.org) team: iOS/macOS security hardening through compiler technology, targeting high-value attack surfaces. Founder of the [LLVM Security Group](https://www.llvm.org/docs/Security.html).
- Compiler engineer on [WebKit](https://webkit.org)’s JavaScriptCore: [WebAssembly](https://en.wikipedia.org/wiki/WebAssembly) implementation, WebAssembly and JavaScript performance tuning, [Spectre](https://meltdownattack.com) mitigations.

### Google
> Compiler Engineer
> 2012-08/2016-08

Portable, fast, and securely sandboxed native code for the Web.
- Instigator, co-designer, compiler engineer on [WebAssembly](https://en.wikipedia.org/wiki/WebAssembly); [2021 ACM SIGPLAN Programming Languages Software Award](https://www.sigplan.org/Awards/Software/).
- Technical leadership of [Portable Native Client](https://en.wikipedia.org/wiki/Google_Native_Client), shipping LLVM to over a billion users.
- Implementor of [Native Client](https://en.wikipedia.org/wiki/Google_Native_Client)’s ARM sandbox.

### NVIDIA
> Compiler Engineer
> 2009-08/2012-08

Dynamic binary translation from ARMv8 to VLIW on the [Denver](https://en.wikipedia.org/wiki/Project_Denver) custom CPU.
- A32, T32, and A64 decode and optimization.
- Supervisor runtime.
- In-memory column-oriented database and custom programming language, used to instrument and analyze hardware and software simulations.

### CAE
> Systems Engineer
> 2006-05/2009-08

Reduced [aircraft simulation](https://en.wikipedia.org/wiki/CAE_Inc.) development effort by an order of magnitude.
- Modern C++03 runtime.
- C++ reflection framework.
- Binary/source compatibility validator.
- Avionics systems engineering using the above-mentioned runtime.
- Legacy Fortran/C maintenance.

### Bombardier
> Engineer Intern
> 2004/2005

Mechanical engineering design on the [Global Express](https://en.wikipedia.org/wiki/Bombardier_Global_Express) business jet.

## Education

### Stanford
> Master’s degree
> Computer science
> 2010/2015

Majority of coursework toward Master’s degree while working full-time; compilers, systems, hardware.

### McGill
> Bachelor’s degree
> Mechanical eng.
> 2002/2006

- Lead TA, 7 semesters, for Computers in Engineering—Fortran, C, and Algorithms.
- Thesis: *Rapid Decompression Simulation in an Aircraft and Related Hardware Optimization*, used to automatically optimize aircraft design while meeting FAA/JAA regulations; Bombardier Aerospace.
- Final project: *Aircraft Assembly Optimization*; Bombardier Aerospace.

## Selected Publications & Public Speaking

### PLDI
> 2017

[Bringing the Web up to Speed with WebAssembly](https://github.com/WebAssembly/spec/blob/main/papers/pldi2017.pdf).
*Best paper award.*
*Re-published as a [Communications of the ACM Research Highlight](https://cacm.acm.org/research/bringing-the-web-up-to-speed-with-webassembly/).*

### ASPLOS
> 2017

[Sound Loop Superoptimization for Google Native Client](https://theory.stanford.edu/~aiken/publications/papers/asplos17.pdf).

### TACAS
> 2018

[EMME: a formal tool for the ECMAScript Memory Model Evaluation](https://arxiv.org/pdf/1801.10140).

### C++ Committee
- [P3477](https://wg21.link/P3477) There are exactly 8 bits in a byte
- [P2809](https://wg21.link/P2809) Trivial infinite loops are not Undefined Behavior
- [P1152](https://wg21.link/P1152) Deprecating `volatile`
- [P0907](https://wg21.link/P0907) Signed integers are two’s complement
- [P1860](https://wg21.link/P1860) C++ networking must be secure by default
- [N4455](https://wg21.link/N4455) No sane compiler would optimize atomics
- [P0323](https://wg21.link/P0323) `std::expected`
- [P2723](https://wg21.link/P2723) Zero-initialize objects of automatic storage duration
- [P1225](https://wg21.link/P1225) Feedback on 2D graphics
- [P1482](https://wg21.link/P1482) Modules feedback
- [P1746](https://wg21.link/P1746) Feedback on `std::audio`
- [P0476](https://wg21.link/P0476) Bit-casting object representations
- [P1382](https://wg21.link/P1382) `volatile` load and `volatile` store
- [P0750](https://wg21.link/P0750) Consume
- [P0690](https://wg21.link/P0690) Tearable atomics
- [P0995](https://wg21.link/P0995) Improving `atomic_flag`
- [P1135](https://wg21.link/P1135) The C++20 synchronization library
- [N4509](https://wg21.link/N4509) `constexpr atomic::is_always_lock_free`
- [P0502](https://wg21.link/P0502) Throwing out of a parallel algorithm terminates
- [P0154](https://wg21.link/P0154) Hardware constructive/destructive interference size
- [P1119](https://wg21.link/P1119) ABI for interference size
- [P0528](https://wg21.link/P0528) Padding bits, atomic compare-and-exchange
- [P1205](https://wg21.link/P1205) Teleportation via `co_await`
- [P0193](https://wg21.link/P0193) Where is vectorization in C++‽
- [P0394](https://wg21.link/P0394r4) Hotel Parallelifornia
- [P0020](https://wg21.link/P0020) Floating point atomic
- [P0153](https://wg21.link/P0153) Atomic object fence
- [P0097](https://wg21.link/P0097) Use cases for thread-local storage
- [P0566](https://wg21.link/P0566) Hazard pointer, RCU
- [P0418](https://wg21.link/P0418) Fail or succeed: there is no atomic lattice
- [P1102](https://wg21.link/P1102) Down with `()!`
- [P1110](https://wg21.link/P1110) A placeholder with no name
- [P1153](https://wg21.link/P1153) Copying volatile subobjects is not trivial
- [P1245](https://wg21.link/P1245) export module containing `[[attribute]];`
- [P1246](https://wg21.link/P1246) The `no_float` function attribute
- [P1247](https://wg21.link/P1247) Disabling `static` destructors
- [P2186](https://wg21.link/P2186) Removing garbage collection support

### NDC TechTown
> 2025

[Much ado about noping (what does a computer do when it has nothing to do?)](https://youtu.be/lgl0WEh5saw?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).

### C++onSea
> 2023

[`*(char*)0 = 0;`](https://youtu.be/dFIqNZ8VbRY?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).
*326k views! 3<sup>rd</sup> most viewed C++ conference talk ever!*

### C++Online
> 2024

[The bytes before the types: unveiling uninitialized uses](https://youtu.be/n7Tl1qJxTew?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).
*Conference keynote.*

### Autosar
> 2024

[From software craft to engineering](https://youtu.be/N8ZiUyQ3phw?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).
*Conference keynote.*

### C++Now
> 2023

[Safety と Security: The Future of C++](https://youtu.be/Gh79wcGJdTg?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).
*Conference keynote.*

### WWDC
> 2019

[What’s new in Clang and LLVM?](https://developer.apple.com/videos/play/wwdc2019/409/)

### LLVM
> 2019

[Making undefined behavior hurt less](https://youtu.be/I-XUHPimq3o?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).

### LLVM
> 2018

[Hardware interference size: new in C++17, add it to libc++](https://youtu.be/LJ4au7WEIBg?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).

### LLVM
> 2018

Migrating to C++14, and beyond!

### LLVM
> 2015

[WebAssembly: Here Be Dragons](https://youtu.be/5W7NkofUtAw?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).
*Conference keynote.*

### EuroLLVM
> 2015

[C++ on the web: ponies for developers without pwn’ing users](https://youtu.be/H-R-yW1-fbQ?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).

### EuroLLVM
> 2014

[Portable Native Client. Fast, Secure, Simple: Pick Three](https://youtu.be/iYBSgdvv0BY?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).

### C++Now
> 2023

[Your Favorite Undefined Behavior in C++](https://youtu.be/e-Gl_x1XDiY?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).

### CppCon
> 2020

[Just-in-Time compilation](https://youtu.be/tWvaSkgVPpA?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).

### CppCon
> 2019

[Deprecating volatile](https://youtu.be/KJW_DLaVXIY?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).

### CppCon
> 2018

[Signed Integers are Two’s Complement](https://youtu.be/JhUxIVf1qok?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).

### CppCon
> 2016

[No sane compiler would optimize atomics](https://youtu.be/IB57wIf9W1k?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).

### CppCast
> 2018

[San Diego EWGI trip report](https://cppcast.com/jf-bastien-san-diego-ewgi).

### CppCast
> 2015

[WebAssembly](https://cppcast.com/jf-bastien-webassembly).

### Tokyo University
> 2023

[Future Mobility: The Relation Between Humans and Services](https://youtu.be/Us_GcPkxFr8?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).

### SAE
> 2021

[Leadership Summit: Evolution of the Vehicle Architecture](https://www.sae.org/blog/wcx-vehicle-architecture).

### eSOL
> 2024

[Hardware and software: separation, or deeper integration?](https://youtu.be/FGEQe7DNXMI?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC).

### Tokyo C++
0. [First meetup](https://youtu.be/FU5Tl_Zdtmw?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC)
0. [C++ and security](https://youtu.be/mrQKfl893e8?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC)
0. [Integrating security into your build pipeline](https://youtu.be/rkDTgkN7FIY?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC)
0. [Reflection in C++26: the renaissance of C++](https://youtu.be/vRda0mGYg_A?list=PLhdfQEWYjzHXFmvFxLWMcBpx1Zms6fscC)

### TLB hit 💥
0. [`mov fp, sp`](https://tlbh.it/000_mov_fp_sp.html)
0. [`*(char*)0 = 0`](https://tlbh.it/001_deref_char_star_0_eq_0.html)
0. [`https://tlb.it^M`](https://tlbh.it/002_https_tlbh_dot_it_CR.html)
0. [`__builtin_expect(!!(x), 0)`](https://tlbh.it/003_builtin_expect_bang_bang_x_0.html)
0. [`t-r-a-c-/e̅‾\-o-m-p-i-l-e`](https://tlbh.it/004_trace_compilers.html)
0. [`Parsers`](https://tlbh.it/005_parsers.html)
0. [`ƑẍɄʑʑ҉⟆Ƒu𝔷𝔷⧫ᶳΩ𝓕𝕦𝘇𝘇֍⧩ `](https://tlbh.it/006_fuzz.html)

## Patents

### [US20260010358A1](https://patents.google.com/patent/US20260010358A1/en)
> System, method, and computer program for managing vehicle software updates
> [JP2026008698A](https://patents.google.com/patent/JP2026008698A/en), [CN121277530A](https://patents.google.com/patent/CN121277530A/en)

### [US12423471B2](https://patents.google.com/patent/US12423471B2/en)
> Program operation sequence determination for reduced potential leakage of personally identifiable information
> [US20250021687A1](https://patents.google.com/patent/US20250021687A1/en), [JP2025013165A](https://patents.google.com/patent/JP2025013165A/en), [JP7692083B2](https://patents.google.com/patent/JP7692083B2/en), [CN119316177A](https://patents.google.com/patent/CN119316177A/en)

### [US20250238572A1](https://patents.google.com/patent/US20250238572A1/en)
> System and method for managing components of a vehicle system
> [JP2025114463A](https://patents.google.com/patent/JP2025114463A/en), [JP7796196B2](https://patents.google.com/patent/JP7796196B2/en), [CN120389957A](https://patents.google.com/patent/CN120389957A/en)

### [US20250147864A1](https://patents.google.com/patent/US20250147864A1/en)
> System and method for performing validations of software
> [JP2025076992A](https://patents.google.com/patent/JP2025076992A/en), [JP7757483B2](https://patents.google.com/patent/JP7757483B2/en), [CN119938485A](https://patents.google.com/patent/CN119938485A/en)

### [US20250060490A1](https://patents.google.com/patent/US20250060490A1/en)
> Vehicle recording based terrain objective characteristic determination
> [JP2025027979A](https://patents.google.com/patent/JP2025027979A/en), [JP7759441B2](https://patents.google.com/patent/JP7759441B2/en), [CN119493114A](https://patents.google.com/patent/CN119493114A/en)

### [US20250060943A1](https://patents.google.com/patent/US20250060943A1/en)
> Providing timing-independence for software
> [JP2025027966A](https://patents.google.com/patent/JP2025027966A/en), [JP7809163B2](https://patents.google.com/patent/JP7809163B2/en), [CN119493593A](https://patents.google.com/patent/CN119493593A/en)

### [US12216672B2](https://patents.google.com/patent/US12216672B2/en)
> Mobile computing network programming for queried content capture
> [US20240330313A1](https://patents.google.com/patent/US20240330313A1/en), [JP2024146718A](https://patents.google.com/patent/JP2024146718A/en), [JP7690008B2](https://patents.google.com/patent/JP7690008B2/en), [CN118733642A](https://patents.google.com/patent/CN118733642A/en)

### [US12204493B2](https://patents.google.com/patent/US12204493B2/en)
> Mobile computing network queried content capture
> [US20240427731A1](https://patents.google.com/patent/US20240427731A1/en), [JP2025003315A](https://patents.google.com/patent/JP2025003315A/en), [JP7742450B2](https://patents.google.com/patent/JP7742450B2/en), [CN119179740A](https://patents.google.com/patent/CN119179740A/en)

### [US12169394B2](https://patents.google.com/patent/US12169394B2/en)
> Method of optimizing execution of a function on a control system and apparatus for the same
> [US20230350354A1](https://patents.google.com/patent/US20230350354A1/en), [EP4270189A1](https://patents.google.com/patent/EP4270189A1/en), [JP2023164278A](https://patents.google.com/patent/JP2023164278A/en), [JP7458521B2](https://patents.google.com/patent/JP7458521B2/en), [CN117008982A](https://patents.google.com/patent/CN117008982A/en)

### [US12045602B2](https://patents.google.com/patent/US12045602B2/en)
> Correctness verification system, method, device, and program
> [US20230305829A1](https://patents.google.com/patent/US20230305829A1/en), [EP4250091A1](https://patents.google.com/patent/EP4250091A1/en), [EP4250091B1](https://patents.google.com/patent/EP4250091B1/en), [JP2023143729A](https://patents.google.com/patent/JP2023143729A/en), [JP7499366B2](https://patents.google.com/patent/JP7499366B2/en), [CN116841861A](https://patents.google.com/patent/CN116841861A/en)

### [US11954034B2](https://patents.google.com/patent/US11954034B2/en)
> Cache coherency protocol for encoding a cache line with a domain shared state
> [US20230305961A1](https://patents.google.com/patent/US20230305961A1/en), [EP4254202A1](https://patents.google.com/patent/EP4254202A1/en), [EP4254202B1](https://patents.google.com/patent/EP4254202B1/en), [JP2023145337A](https://patents.google.com/patent/JP2023145337A/en), [CN116860663A](https://patents.google.com/patent/CN116860663A/en)

### [US11860996B1](https://patents.google.com/patent/US11860996B1/en)
> Security concepts for web frameworks

### [US9189375B1](https://patents.google.com/patent/US9189375B1/en)
> Dynamic sandboxing
> [US10031832B1](https://patents.google.com/patent/US10031832B1/en)

### [US9563424B2](https://patents.google.com/patent/US9563424B2/en)
> Native code instruction selection
> [US20140052971A1](https://patents.google.com/patent/US20140052971A1/en), [WO2014028215A1](https://patents.google.com/patent/WO2014028215A1/en)

### [US9223550B1](https://patents.google.com/patent/US9223550B1/en)
> Portable handling of primitives for concurrent execution

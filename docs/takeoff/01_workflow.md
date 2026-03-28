# Takeoff workflow

## Goal
Build a repeatable workflow for PDF plan review, traced overlay creation, classification, quantity reconciliation, and final project markup.

## Core sequence
1. Collect source files
2. Build project feature dictionary
3. Assign sheet roles
4. Create neutral geometry trace
5. Classify features by type
6. Apply markup colors and symbols
7. Reconcile quantities against workbook / takeoff
8. Rework and cycle until stable
9. Publish overview markup and final report

## Review cycles
### Cycle 0 – Evidence
- confirm feature list
- confirm legend terms
- confirm sheet authority

### Cycle 1 – Trace
- extract / trace obvious linework
- no final quantity lock

### Cycle 2 – Classification
- color by class
- flag uncertain segments

### Cycle 3 – Reconciliation
- compare lengths, areas, counts to expected totals
- identify gaps and double counts

### Cycle 4 – Finalization
- lock markup
- export summary

## Inputs
- plan set PDFs
- marked up takeoff PDFs
- quantity workbook
- Bluebeam toolset (.btx)

## Outputs
- feature dictionary
- sheet role map
- colored overlays
- reconciliation report
- final project overview

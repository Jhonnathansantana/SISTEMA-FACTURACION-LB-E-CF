# SISTEMA FACTURACION LB-E-CF

## Project Overview
This project is an Offline-First SaaS Electronic Invoicing system for the Dominican Republic (DGII). It uses React, Vite, TypeScript, Dexie.js, and Supabase.

## Fiscal Logic Requirements

The system must strictly adhere to the following fiscal rules mandated by the DGII:

### 1. RNC Validation (Module 11)
All Taxpayer Identification Numbers (RNC - Registro Nacional de Contribuyentes) and Cedulas must be validated using the **Module 11** algorithm.

*   **RNC (Corporate)**: 9 digits.
*   **Cedula (Individual)**: 11 digits.

**Algorithm Steps:**
1.  Assign a weight to each digit (from right to left, or specific pattern depending on standard).
2.  Sum the products of digits and weights.
3.  Calculate the remainder of the sum divided by 11.
4.  Determine the check digit based on the remainder.

### 2. NCF Management (Series E)
The system manages Electronic Tax Receipt Numbers (e-NCF), specifically **Series E**.

*   Format: `E` + `Type (2 digits)` + `Sequence (10 digits)`.
*   Example: `E3100000001` (E + 31 + 00000001).

**Common NCF Types:**
*   `31`: Factura de Crédito Fiscal Electrónica.
*   `32`: Factura de Consumo Electrónica.
*   `33`: Nota de Débito Electrónica.
*   `34`: Nota de Crédito Electrónica.
*   `41`: Compras Electrónicas (Informal suppliers).
*   `43`: Gastos Menores Electrónicos.
*   `44`: Regímenes Especiales Electrónicos.
*   `45`: Gubernamental Electrónico.

### 3. ITBIS Calculations
The system must handle specific tax rates:
*   Standard: 18%
*   Reduced: 16%
*   Exempt: 0%

Calculations must be precise and handle rounding to 2 decimal places correctly.

## Tech Stack
*   React + Vite
*   TypeScript
*   Dexie.js (IndexedDB)
*   Supabase
*   Tailwind CSS
*   Lucide-React
*   Vitest (Testing)

# Globus Bank Wallet Integration

**Status:** ✅ Ready for Testing  
**Version:** 1.0.0  
**Last Updated:** November 5, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Setup Instructions](#setup-instructions)
5. [Database Schema](#database-schema)
6. [API Integration](#api-integration)
7. [Testing Guide](#testing-guide)
8. [User Flow](#user-flow)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This integration connects Quilox Privé members with Globus Bank virtual accounts, enabling:
- **Automatic wallet creation** after 5 confirmed bookings
- **Real-time balance** display on Privé screen
- **Secure fund management** through Globus Bank API
- **Transaction history** tracking

### Business Logic

---

## Features

### ✅ Implemented

1. **Privé Qualification System**
   - Tracks user bookings automatically
   - Triggers wallet creation at 5 bookings
   - Shows progress bar for non-qualified users

2. **Virtual Account Creation**
   - Integrates with Globus Bank API
   - Generates unique 10-digit account number
   - Associates with user's Supabase auth ID

3. **Balance Display**
   - Real-time balance from Globus Bank
   - Pull-to-refresh functionality
   - Formatted in Nigerian Naira (₦)

4. **Security**
   - Row Level Security (RLS) on database
   - Secure API key management
   - User can only see their own wallet

5. **Error Handling**
   - Graceful fallbacks for API failures
   - Comprehensive logging
   - User-friendly error messages

---

## Architecture

### Components


### Data Flow

1. **User opens Privé screen**
   - `useWallet` hook loads
   - Checks booking count
   - Determines qualification

2. **If qualified (≥5 bookings)**
   - Checks if wallet exists
   - If not, creates via Globus Bank API
   - Saves to Supabase
   - Fetches current balance

3. **Display wallet**
   - Shows account number
   - Shows balance
   - Enables pull-to-refresh

---

## Setup Instructions

### 1. Environment Variables

Create `.env` file:

```bash
# Copy from .env.example
cp .env.example .env

# Add your Globus Bank sandbox credentials
EXPO_PUBLIC_GLOBUS_API_KEY=your_sandbox_key_here
EXPO_PUBLIC_GLOBUS_SECRET_KEY=your_sandbox_secret_here
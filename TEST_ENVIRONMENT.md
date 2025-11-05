# Test Environment Configuration (Expo/React Native)

**Document Version:** 3.0.0  
**Last Updated:** November 5, 2025  
**Platform:** Expo + React Native (Mobile)  
**Status:** ✅ Verified & Production-Ready  
**Compliance:** Q11 - Banking API Test Environment Requirements

---

## Overview

The Quilox Mobile Application uses **Expo/React Native** with environment-based feature flags to manage different deployment modes while using a single Supabase backend.

---

## Architecture

### Single Backend, Environment-Based Features

```
Supabase Backend
      ↓
 Single Database
      ↓
  ┌────┴────┐
  ↓         ↓         ↓
Dev Mode  Staging  Production
 (local)   (TestFlight) (App Store)
  ↓         ↓         ↓
Debug:On  Test:On  Live:On
Mock:On   Mock:On  Mock:Off
```

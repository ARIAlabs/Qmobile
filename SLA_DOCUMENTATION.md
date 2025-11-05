# Service Level Agreement (SLA) Documentation

**Document Version:** 1.0.0  
**Effective Date:** November 5, 2025  
**Last Updated:** November 5, 2025  
**Status:** ✅ Active  
**Compliance:** Q21 - Banking API Integration Requirements

---

## Table of Contents

1. [Overview](#overview)
2. [Service Scope](#service-scope)
3. [Availability Commitments](#availability-commitments)
4. [Performance Standards](#performance-standards)
5. [Support & Response Times](#support--response-times)
6. [Incident Management](#incident-management)
7. [Maintenance Windows](#maintenance-windows)
8. [Service Credits & Remediation](#service-credits--remediation)
9. [Monitoring & Reporting](#monitoring--reporting)
10. [Third-Party Dependencies](#third-party-dependencies)

---

## Overview

This Service Level Agreement (SLA) defines the performance, availability, and support commitments for the **Quilox Mobile Application** and its integration with banking APIs, payment processing, and backend services.

### Purpose

To establish clear expectations and accountability for:
- Application uptime and availability
- API response times and performance
- Support response and resolution times
- Incident management procedures
- Data backup and recovery commitments

### Scope

This SLA applies to:
- ✅ Quilox Mobile Application (iOS, Android, Web)
- ✅ Supabase Backend Services
- ✅ Banking API Integrations
- ✅ Payment Processing Services
- ✅ Authentication & Authorization Systems
- ✅ Data Storage & Backup Systems

---

## Service Scope

### 1. Core Services Covered

#### Mobile Application
- **Platform:** iOS, Android, Web
- **Services:** All customer-facing features
- **Coverage:** 24/7/365
- **Uptime Target:** 99.5%

#### Backend API (Supabase)
- **Service:** PostgreSQL Database, REST API, Real-time subscriptions
- **Coverage:** 24/7/365
- **Uptime Target:** 99.9%
- **Provider SLA:** Supabase Cloud (backed by AWS)

#### Authentication System
- **Service:** User authentication, session management, JWT tokens
- **Coverage:** 24/7/365
- **Uptime Target:** 99.9%

#### Payment Processing
- **Service:** Booking payments, transaction processing
- **Coverage:** 24/7/365
- **Uptime Target:** 99.95%

#### Storage & CDN
- **Service:** Image storage, asset delivery
- **Coverage:** 24/7/365
- **Uptime Target:** 99.9%

---

## Availability Commitments

### Service Availability Targets

| Service | Monthly Uptime | Downtime Allowed | Status Page |
|---------|----------------|------------------|-------------|
| **Mobile App** | 99.5% | 3h 38m | ✅ Active |
| **Backend API** | 99.9% | 43m | ✅ Active |
| **Authentication** | 99.9% | 43m | ✅ Critical |
| **Payment Processing** | 99.95% | 21m | ✅ Critical |
| **Storage/CDN** | 99.9% | 43m | ✅ Active |
| **Database** | 99.99% | 4m | ✅ Critical |

### Uptime Calculation

**Uptime Percentage** = (Total Minutes in Month - Downtime Minutes) / Total Minutes in Month × 100

**Exclusions from Downtime:**
- ✅ Scheduled maintenance (with 72-hour notice)
- ✅ Customer-initiated actions
- ✅ Third-party service outages beyond our control
- ✅ Force majeure events
- ✅ Beta/experimental features

### Availability by Environment

| Environment | Uptime Target | Monitoring | Support Hours |
|-------------|---------------|------------|---------------|
| **Production** | 99.9% | 24/7 | 24/7 |
| **Staging** | 99.0% | Business hours | Business hours |
| **Development** | Best effort | None | Business hours |

---

## Performance Standards

### API Response Times

#### REST API Endpoints

| Endpoint Type | Target (p95) | Target (p99) | Timeout |
|---------------|--------------|--------------|---------|
| **GET /carousel** | < 200ms | < 500ms | 5s |
| **GET /products** | < 300ms | < 700ms | 10s |
| **GET /feed** | < 250ms | < 600ms | 10s |
| **POST /bookings** | < 500ms | < 1000ms | 30s |
| **GET /bookings** | < 300ms | < 700ms | 10s |
| **PUT /bookings** | < 400ms | < 800ms | 30s |
| **POST /auth** | < 300ms | < 700ms | 10s |
| **GET /tables** | < 200ms | < 500ms | 5s |

**Measurement:** 95th percentile (p95) and 99th percentile (p99) over rolling 24-hour period

#### Database Queries

| Query Type | Target | Maximum |
|------------|--------|---------|
| Simple SELECT | < 50ms | 200ms |
| Complex JOIN | < 200ms | 500ms |
| INSERT/UPDATE | < 100ms | 300ms |
| Full-text search | < 300ms | 1000ms |

### App Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Cold Start Time** | < 3s | App launch to interactive |
| **Hot Start Time** | < 1s | App resume to interactive |
| **Screen Transition** | < 300ms | Navigation timing |
| **Image Load Time** | < 2s | First contentful paint |
| **Bundle Size** | < 15MB | iOS/Android app size |

### Network Performance

| Metric | Target | Notes |
|--------|--------|-------|
| **DNS Resolution** | < 50ms | Global average |
| **TLS Handshake** | < 200ms | Global average |
| **Time to First Byte** | < 300ms | Server response |
| **Total Request Time** | < 1s | End-to-end |

---

## Support & Response Times

### Support Tiers

#### Tier 1: Critical (Priority 1)
- **Definition:** Service completely unavailable, security breach, data loss
- **Response Time:** 15 minutes
- **Resolution Target:** 1 hour
- **Availability:** 24/7/365
- **Communication:** Every 30 minutes

**Examples:**
- Complete application outage
- Authentication system failure
- Payment processing failure
- Data breach or security incident
- Database corruption

#### Tier 2: High (Priority 2)
- **Definition:** Major functionality impaired, significant user impact
- **Response Time:** 1 hour
- **Resolution Target:** 4 hours
- **Availability:** 24/7/365
- **Communication:** Every 2 hours

**Examples:**
- Booking system unavailable
- API endpoints returning errors
- Performance degradation (> 50% slower)
- Intermittent authentication issues

#### Tier 3: Medium (Priority 3)
- **Definition:** Minor functionality issue, workaround available
- **Response Time:** 4 hours
- **Resolution Target:** 24 hours
- **Availability:** Business hours (9 AM - 6 PM WAT, Mon-Fri)
- **Communication:** Daily updates

**Examples:**
- UI bugs
- Minor performance issues
- Non-critical feature failures
- Cosmetic issues

#### Tier 4: Low (Priority 4)
- **Definition:** Enhancement requests, documentation, minor issues
- **Response Time:** 24 hours
- **Resolution Target:** 7 days
- **Availability:** Business hours
- **Communication:** Weekly updates

**Examples:**
- Feature requests
- Documentation updates
- Minor UX improvements
- Non-urgent questions

### Support Channels

| Channel | Priority Levels | Response Time | Hours |
|---------|----------------|---------------|-------|
| **PagerDuty** | P1 only | < 15 min | 24/7 |
| **Email (urgent@quilox.com)** | P1, P2 | < 1 hour | 24/7 |
| **Slack (#prod-alerts)** | P1, P2, P3 | < 4 hours | 24/7 |
| **Email (support@quilox.com)** | All | < 24 hours | Business |
| **Help Center** | P3, P4 | < 48 hours | Business |

---

## Incident Management

### Incident Response Process

#### 1. Detection (0-5 minutes)
- Automated monitoring alerts
- User reports via support channels
- Internal team discovery

#### 2. Acknowledgment (5-15 minutes)
- On-call engineer notified
- Incident ticket created
- Initial status posted

#### 3. Investigation (15-30 minutes)
- Root cause analysis
- Impact assessment
- Severity classification

#### 4. Communication (30+ minutes)
- Status page updated
- Stakeholders notified
- Regular updates provided

#### 5. Resolution
- Fix implemented
- Testing and verification
- Service restored

#### 6. Post-Mortem (Within 48 hours)
- Root cause documented
- Timeline published
- Prevention measures identified
- Action items assigned

### Incident Severity Classification

| Severity | Impact | Examples | Max Resolution Time |
|----------|--------|----------|---------------------|
| **SEV-1** | Critical | Complete outage, data loss | 1 hour |
| **SEV-2** | High | Major feature down, degraded | 4 hours |
| **SEV-3** | Medium | Minor feature issue | 24 hours |
| **SEV-4** | Low | Cosmetic, enhancement | 7 days |

### Communication During Incidents

#### Status Page Updates
- **SEV-1:** Every 15 minutes
- **SEV-2:** Every 30 minutes
- **SEV-3:** Every 2 hours
- **SEV-4:** Daily

#### Stakeholder Notifications
- Email to affected customers
- SMS for critical incidents (P1)
- In-app notifications
- Social media updates (if major)

---

## Maintenance Windows

### Scheduled Maintenance

#### Standard Maintenance Window
- **Day:** Sundays
- **Time:** 2:00 AM - 6:00 AM WAT (West Africa Time)
- **Frequency:** Monthly (first Sunday)
- **Notification:** 72 hours in advance

#### Emergency Maintenance
- **Notification:** 4 hours in advance (when possible)
- **Approval:** CTO or Engineering Manager
- **Maximum Duration:** 2 hours
- **Rollback Plan:** Required

### Maintenance Types

| Type | Downtime | Notice Required | Frequency |
|------|----------|-----------------|-----------|
| **Database Updates** | < 30 min | 1 week | Quarterly |
| **Security Patches** | < 15 min | 72 hours | As needed |
| **Feature Deployments** | 0 min (zero-downtime) | 24 hours | Weekly |
| **Infrastructure Upgrades** | < 1 hour | 1 week | Quarterly |
| **Emergency Patches** | < 15 min | 4 hours | As needed |

### Zero-Downtime Deployments

We strive for **zero-downtime deployments** using:
- Blue-green deployments
- Rolling updates
- Feature flags
- Database migrations with backward compatibility

---

## Service Credits & Remediation

### Service Credit Policy

If we fail to meet our SLA commitments, customers are eligible for service credits:

| Actual Uptime | Service Credit |
|---------------|----------------|
| < 99.9% but ≥ 99.0% | 10% of monthly fee |
| < 99.0% but ≥ 95.0% | 25% of monthly fee |
| < 95.0% | 50% of monthly fee |

### Claiming Service Credits

1. Submit claim within 30 days of incident
2. Provide incident details and evidence
3. Credits processed within 15 business days
4. Applied to next billing cycle

### Exclusions

Service credits do not apply to:
- Scheduled maintenance (with proper notice)
- Issues caused by customer actions
- Third-party service failures
- Force majeure events
- Beta/experimental features

---

## Monitoring & Reporting

### Real-Time Monitoring

#### Application Monitoring
- **Tool:** Sentry, LogRocket
- **Metrics:** Error rates, crash rates, performance
- **Alerting:** Real-time PagerDuty integration

#### API Monitoring
- **Tool:** Datadog, Pingdom
- **Metrics:** Response times, error rates, throughput
- **Alerting:** Threshold-based alerts

#### Database Monitoring
- **Tool:** Supabase Dashboard, AWS RDS Insights
- **Metrics:** Query performance, connections, storage
- **Alerting:** Automated alerts for anomalies

#### Infrastructure Monitoring
- **Tool:** AWS CloudWatch, Supabase Monitoring
- **Metrics:** CPU, memory, disk, network
- **Alerting:** Threshold and predictive alerts

### Status Page

**URL:** status.quilox.com

**Updates Include:**
- Current service status
- Ongoing incidents
- Scheduled maintenance
- Historical uptime data

**Subscribe to:**
- Email notifications
- SMS alerts
- RSS feed
- Slack integration

### Monthly SLA Reports

Delivered by 5th of each month, including:
- Overall uptime percentage
- Incident summary
- Performance metrics
- Availability by service
- Mean Time To Resolution (MTTR)
- Service credits issued
- Improvement initiatives

---

## Third-Party Dependencies

### Supabase (Backend Infrastructure)

**Provider:** Supabase Inc. (AWS-backed)  
**SLA:** 99.9% uptime  
**Support:** 24/7 enterprise support  
**Status:** https://status.supabase.com  
**DPA:** Executed ✅

**Services:**
- PostgreSQL database
- Authentication
- Storage
- Real-time subscriptions

### AWS (Infrastructure Layer)

**Provider:** Amazon Web Services  
**Region:** eu-west-1 (Ireland)  
**SLA:** 99.99% (Multi-AZ)  
**Compliance:** SOC 2, ISO 27001, PCI DSS

### Expo (Mobile Infrastructure)

**Provider:** Expo.io  
**Services:** OTA updates, push notifications  
**SLA:** 99.9%  
**Status:** https://status.expo.dev

### CDN & Asset Delivery

**Provider:** Supabase Storage (AWS S3 + CloudFront)  
**SLA:** 99.9%  
**Coverage:** Global edge locations

---

## Definitions

### Uptime
Percentage of time the service is available and functioning correctly during a calendar month.

### Downtime
Any period when the service is unavailable to users, excluding scheduled maintenance and exclusions.

### Response Time
Time from when incident is reported/detected to when a qualified engineer begins investigating.

### Resolution Time
Time from incident detection to when service is fully restored and verified.

### Planned Maintenance
Scheduled service interruptions communicated to customers with advance notice.

### Emergency Maintenance
Unplanned service interruptions required to address critical issues.

---

## SLA Modifications

This SLA may be updated with:
- **Minor changes:** 30 days notice
- **Major changes:** 90 days notice
- **Emergency changes:** Immediate (with retroactive notification)

**Change Log:**
- v1.0.0 (Nov 5, 2025): Initial SLA document

---

## Contact Information

### Emergency Contact (24/7)
- **PagerDuty:** +1-xxx-xxx-xxxx
- **Email:** urgent@quilox.com
- **Slack:** #prod-alerts

### Support Contact
- **Email:** support@quilox.com
- **Phone:** +234-xxx-xxx-xxxx (Business hours)
- **Help Center:** help.quilox.com

### Account Management
- **Email:** accounts@quilox.com
- **Phone:** +234-xxx-xxx-xxxx

---

## Compliance & Certifications

This SLA supports compliance with:
- ✅ Nigeria Data Protection Regulation (NDPR)
- ✅ ISO 27001 (Information Security)
- ✅ PCI DSS Level 1 (Payment Card Industry)
- ✅ SOC 2 Type II (via Supabase/AWS)

---

**Document Owner:** Engineering & Operations Team  
**Review Cycle:** Quarterly  
**Next Review:** February 5, 2026  
**Approval:** CTO, Head of Operations

---


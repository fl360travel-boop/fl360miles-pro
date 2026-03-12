/**
 * Unit tests for billing logic pure functions.
 * Run with: npx tsx scripts/billingLogic.test.ts
 */

// =============================================
// Import pure functions (we inline them here for standalone execution)
// =============================================

type BillingStatusType = 'ACTIVE' | 'TRIAL' | 'DUE_SOON' | 'DUE_TODAY' | 'OVERDUE_WARNING' | 'BLOCKED';

function calculateDueDate(lastPaidAt: string | null): string | null {
    if (!lastPaidAt) return null;
    const d = new Date(lastPaidAt);
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
}

function calculateStatus(todayStr: string, dueDateStr: string | null, trialEndsAtStr?: string | null): BillingStatusType {
    if (trialEndsAtStr) {
        const today = new Date(todayStr + 'T00:00:00');
        const trialEndsAt = new Date(trialEndsAtStr + 'T00:00:00');
        if (today <= trialEndsAt) return 'TRIAL';
        if (!dueDateStr) return 'BLOCKED'; // Trial expired and no payment yet
    }

    if (!dueDateStr) return 'ACTIVE';
    const today = new Date(todayStr + 'T00:00:00');
    const dueDate = new Date(dueDateStr + 'T00:00:00');
    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 5) return 'ACTIVE';
    if (diffDays >= 1 && diffDays <= 5) return 'DUE_SOON';
    if (diffDays === 0) return 'DUE_TODAY';
    if (diffDays >= -3 && diffDays < 0) return 'OVERDUE_WARNING';
    return 'BLOCKED';
}

function remainingDays(todayStr: string, dueDateStr: string | null): number {
    if (!dueDateStr) return 999;
    const today = new Date(todayStr + 'T00:00:00');
    const dueDate = new Date(dueDateStr + 'T00:00:00');
    return Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function shouldShowPopup(
    status: BillingStatusType,
    todayStr: string,
    popupLastShownAt: string | null,
    popupSnoozedUntil: string | null,
    nowISO: string
): boolean {
    if (status === 'ACTIVE' || status === 'BLOCKED') return false;
    if (popupLastShownAt === todayStr) return false;
    if (popupSnoozedUntil) {
        const snoozedUntil = new Date(popupSnoozedUntil);
        const now = new Date(nowISO);
        if (now < snoozedUntil) return false;
    }
    return true;
}

// =============================================
// TEST RUNNER
// =============================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
    if (condition) {
        console.log(`  ✅ ${name}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${name}`);
        failed++;
    }
}

function section(name: string) {
    console.log(`\n📋 ${name}`);
}

// =============================================
// TESTS
// =============================================

section('calculateDueDate');
assert(calculateDueDate(null) === null, 'null input returns null');
assert(calculateDueDate('2026-01-01T00:00:00Z') === '2026-01-31', 'Jan 1 + 30 = Jan 31');
assert(calculateDueDate('2026-02-15T12:00:00Z') === '2026-03-17', 'Feb 15 + 30 = Mar 17');
assert(calculateDueDate('2026-12-10T00:00:00Z') === '2027-01-09', 'Dec 10 + 30 = Jan 9 next year');

section('calculateStatus');
assert(calculateStatus('2026-02-01', '2026-02-20') === 'ACTIVE', '19 days before = ACTIVE');
assert(calculateStatus('2026-02-01', '2026-02-07') === 'ACTIVE', '6 days before = ACTIVE');
assert(calculateStatus('2026-02-01', '2026-02-06') === 'DUE_SOON', '5 days before = DUE_SOON');
assert(calculateStatus('2026-02-01', '2026-02-04') === 'DUE_SOON', '3 days before = DUE_SOON');
assert(calculateStatus('2026-02-01', '2026-02-02') === 'DUE_SOON', '1 day before = DUE_SOON');
assert(calculateStatus('2026-02-01', '2026-02-01') === 'DUE_TODAY', 'same day = DUE_TODAY');
assert(calculateStatus('2026-02-02', '2026-02-01') === 'OVERDUE_WARNING', '1 day after = OVERDUE_WARNING');
assert(calculateStatus('2026-02-03', '2026-02-01') === 'OVERDUE_WARNING', '2 days after = OVERDUE_WARNING');
assert(calculateStatus('2026-02-04', '2026-02-01') === 'OVERDUE_WARNING', '3 days after = OVERDUE_WARNING');
assert(calculateStatus('2026-02-05', '2026-02-01') === 'BLOCKED', '4 days after = BLOCKED');
assert(calculateStatus('2026-02-10', '2026-02-01') === 'BLOCKED', '9 days after = BLOCKED');
assert(calculateStatus('2026-02-01', null) === 'ACTIVE', 'null due date = ACTIVE');

section('calculateStatus - TRIAL');
assert(calculateStatus('2026-02-01', null, '2026-02-07') === 'TRIAL', 'Today <= TrialEnd = TRIAL');
assert(calculateStatus('2026-02-07', null, '2026-02-07') === 'TRIAL', 'Last day of trial = TRIAL');
assert(calculateStatus('2026-02-08', null, '2026-02-07') === 'BLOCKED', 'Today > TrialEnd and no DueDate = BLOCKED');
assert(calculateStatus('2026-02-08', '2026-03-08', '2026-02-07') === 'ACTIVE', 'Trial expired but HAS DueDate = ACTIVE (converted to paid)');

section('remainingDays');
assert(remainingDays('2026-02-01', '2026-02-06') === 5, '5 days remaining');
assert(remainingDays('2026-02-01', '2026-02-01') === 0, '0 days remaining (due today)');
assert(remainingDays('2026-02-04', '2026-02-01') === -3, '-3 days (3 days overdue)');
assert(remainingDays('2026-02-01', null) === 999, 'null due date = 999');

section('shouldShowPopup');
// Should show for DUE_SOON, not shown today, no snooze
assert(
    shouldShowPopup('DUE_SOON', '2026-02-25', null, null, '2026-02-25T10:00:00Z') === true,
    'DUE_SOON, first time today = show'
);

// Should NOT show for ACTIVE
assert(
    shouldShowPopup('ACTIVE', '2026-02-25', null, null, '2026-02-25T10:00:00Z') === false,
    'ACTIVE = never show'
);

// Should NOT show for BLOCKED (blocked screen handles it)
assert(
    shouldShowPopup('BLOCKED', '2026-02-25', null, null, '2026-02-25T10:00:00Z') === false,
    'BLOCKED = never show popup (blocked screen instead)'
);

// Should NOT show if already shown today
assert(
    shouldShowPopup('DUE_SOON', '2026-02-25', '2026-02-25', null, '2026-02-25T14:00:00Z') === false,
    'Already shown today = do not show'
);

// Should show if shown yesterday
assert(
    shouldShowPopup('DUE_SOON', '2026-02-25', '2026-02-24', null, '2026-02-25T10:00:00Z') === true,
    'Shown yesterday = show today'
);

// Should NOT show if snoozed until 23:59 today and now is before that
assert(
    shouldShowPopup('DUE_TODAY', '2026-02-25', null, '2026-02-25T23:59:59Z', '2026-02-25T15:00:00Z') === false,
    'Snoozed until 23:59 today, now 15:00 = do not show'
);

// Should show if snooze expired (next day)
assert(
    shouldShowPopup('DUE_TODAY', '2026-02-26', null, '2026-02-25T23:59:59Z', '2026-02-26T08:00:00Z') === true,
    'Snooze expired (next day) = show'
);

// OVERDUE_WARNING should show popup
assert(
    shouldShowPopup('OVERDUE_WARNING', '2026-02-25', null, null, '2026-02-25T10:00:00Z') === true,
    'OVERDUE_WARNING, first time = show'
);

// DUE_TODAY should show popup
assert(
    shouldShowPopup('DUE_TODAY', '2026-02-25', null, null, '2026-02-25T10:00:00Z') === true,
    'DUE_TODAY, first time = show'
);

// =============================================
// RESULTS
// =============================================
console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) {
    console.error('\n🔴 SOME TESTS FAILED');
    process.exit(1);
} else {
    console.log('\n🟢 ALL TESTS PASSED');
    process.exit(0);
}

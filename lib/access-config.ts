/**
 * Access Control Configuration
 * 
 * Single source of truth for app sections, paths, and access control.
 * Used by sidebar navigation, route guards, and admin UI.
 */

export interface Section {
    key: string
    label: string
    path: string
    description?: string
}

/**
 * All available sections in the application.
 * This list defines what can be controlled via user.allowed_sections.
 */
export const SECTIONS: Section[] = [
    {
        key: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        description: "Overview and key metrics"
    },
    {
        key: "calendar",
        label: "Calendar",
        path: "/calendar",
        description: "Appointments and scheduling"
    },
    {
        key: "patients",
        label: "Patients",
        path: "/patients",
        description: "Patient records and information"
    },
    {
        key: "treatments",
        label: "Treatments",
        path: "/treatments",
        description: "Treatment records and procedures"
    },
    {
        key: "clinical-referrals",
        label: "Clinical Referrals",
        path: "/clinical-referrals",
        description: "Send and receive referrals"
    },
    {
        key: "invoices",
        label: "Invoices",
        path: "/invoices",
        description: "Billing and invoices"
    },
    {
        key: "insurance-claims",
        label: "Insurance Claims",
        path: "/insurance-claims",
        description: "Insurance claim management"
    },
    {
        key: "payments",
        label: "Payments",
        path: "/payments",
        description: "Payment processing and history"
    },
    {
        key: "messages",
        label: "Messages",
        path: "/messages",
        description: "Internal messaging"
    },
    {
        key: "reports",
        label: "Reports",
        path: "/reports",
        description: "Analytics and reports"
    },
    {
        key: "staff",
        label: "Staff",
        path: "/staff",
        description: "Team member management"
    },
    {
        key: "team-planner",
        label: "Team Planner",
        path: "/team-planner",
        description: "Schedule and resource planning"
    },
    {
        key: "settings",
        label: "Settings",
        path: "/settings",
        description: "Application settings"
    }
]

/**
 * Map of section keys for quick lookup
 */
export const SECTION_MAP = new Map(SECTIONS.map(s => [s.key, s]))

/**
 * Get section by path
 */
export function getSectionByPath(path: string): Section | undefined {
    // Match exact path or paths that start with the section path
    return SECTIONS.find(s => path === s.path || path.startsWith(s.path + '/'))
}

/**
 * Get section by key
 */
export function getSectionByKey(key: string): Section | undefined {
    return SECTION_MAP.get(key)
}

/**
 * Available limit types that can be enforced
 */
export interface LimitType {
    key: string
    label: string
    description: string
    defaultValue?: number
}

export const LIMIT_TYPES: LimitType[] = [
    {
        key: "patients",
        label: "Max Patients",
        description: "Maximum number of patients this user can manage",
    },
    {
        key: "appointments_per_month",
        label: "Appointments Per Month",
        description: "Maximum appointments this user can create per month",
    }
]

export const LIMIT_TYPE_MAP = new Map(LIMIT_TYPES.map(l => [l.key, l]))

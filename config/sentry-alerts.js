// Sentry Alert Rules Configuration
// This file contains configurations for Sentry alerts
// Apply these via Sentry CLI or manually in the Sentry dashboard

const SENTRY_ALERT_RULES = {
  // Critical Error Alert - Triggers on any error
  criticalErrors: {
    name: "Critical Errors",
    conditions: [
      {
        id: "sentry.rules.conditions.event_attribute.EventAttributeCondition",
        attribute: "level",
        match: "equal",
        value: "error"
      }
    ],
    actions: [
      {
        id: "sentry.rules.actions.notify_email.NotifyEmailAction",
        targetType: "IssueOwners",
        targetIdentifier: ""
      },
      {
        id: "sentry.integrations.slack.notify_action.SlackNotifyServiceAction",
        channel: "#alerts",
        tags: "environment,level"
      }
    ],
    filters: [
      {
        id: "sentry.rules.filters.age_comparison.AgeComparisonFilter",
        comparison_type: "older",
        value: 5, // minutes
        time: "minute"
      }
    ],
    frequency: 5, // minutes
    actionMatch: "any",
    filterMatch: "all"
  },

  // High Error Rate Alert
  highErrorRate: {
    name: "High Error Rate",
    conditions: [
      {
        id: "sentry.rules.conditions.event_frequency.EventFrequencyCondition",
        value: 10,
        interval: "1m"
      }
    ],
    actions: [
      {
        id: "sentry.rules.actions.notify_email.NotifyEmailAction",
        targetType: "IssueOwners"
      }
    ],
    frequency: 5
  },

  // Performance Issues Alert
  performanceIssues: {
    name: "Performance Degradation",
    conditions: [
      {
        id: "sentry.rules.conditions.event_attribute.EventAttributeCondition",
        attribute: "transaction.duration",
        match: "greater",
        value: 5000 // 5 seconds
      }
    ],
    actions: [
      {
        id: "sentry.rules.actions.notify_email.NotifyEmailAction",
        targetType: "IssueOwners"
      }
    ],
    frequency: 15
  },

  // Security Issues Alert
  securityIssues: {
    name: "Security Issues",
    conditions: [
      {
        id: "sentry.rules.conditions.tagged_event.TaggedEventCondition",
        key: "security",
        match: "equal",
        value: "issue"
      }
    ],
    actions: [
      {
        id: "sentry.rules.actions.notify_email.NotifyEmailAction",
        targetType: "IssueOwners"
      },
      {
        id: "sentry.integrations.slack.notify_action.SlackNotifyServiceAction",
        channel: "#security-alerts",
        tags: "security,environment"
      }
    ],
    frequency: 1 // Immediate
  },

  // Database Connection Issues
  databaseIssues: {
    name: "Database Connection Issues",
    conditions: [
      {
        id: "sentry.rules.conditions.event_attribute.EventAttributeCondition",
        attribute: "message",
        match: "contains",
        value: "database"
      },
      {
        id: "sentry.rules.conditions.event_attribute.EventAttributeCondition",
        attribute: "level",
        match: "equal",
        value: "error"
      }
    ],
    actions: [
      {
        id: "sentry.rules.actions.notify_email.NotifyEmailAction",
        targetType: "IssueOwners"
      }
    ],
    frequency: 5
  },

  // Authentication Failures
  authenticationFailures: {
    name: "Authentication Failures",
    conditions: [
      {
        id: "sentry.rules.conditions.tagged_event.TaggedEventCondition",
        key: "auth",
        match: "equal",
        value: "failure"
      }
    ],
    actions: [
      {
        id: "sentry.rules.actions.notify_email.NotifyEmailAction",
        targetType: "IssueOwners"
      }
    ],
    frequency: 5
  }
};

// Environment-specific configurations
const ENVIRONMENT_CONFIGS = {
  production: {
    alertThresholds: {
      errorRate: 5,
      responseTime: 2000,
      errorCount: 10
    },
    notifications: {
      email: true,
      slack: true,
      webhook: true
    }
  },
  staging: {
    alertThresholds: {
      errorRate: 10,
      responseTime: 5000,
      errorCount: 20
    },
    notifications: {
      email: true,
      slack: false,
      webhook: false
    }
  },
  development: {
    alertThresholds: {
      errorRate: 50,
      responseTime: 10000,
      errorCount: 100
    },
    notifications: {
      email: false,
      slack: false,
      webhook: false
    }
  }
};

// Sentry CLI commands to create these alerts
const CLI_COMMANDS = {
  // Create alert rule
  createRule: (ruleName, conditions, actions) => {
    return `sentry-cli alerts rules create "${ruleName}" \\
      --conditions '${JSON.stringify(conditions)}' \\
      --actions '${JSON.stringify(actions)}'`;
  },

  // List existing rules
  listRules: "sentry-cli alerts rules list",

  // Delete rule
  deleteRule: (ruleId) => `sentry-cli alerts rules delete ${ruleId}`
};

module.exports = {
  SENTRY_ALERT_RULES,
  ENVIRONMENT_CONFIGS,
  CLI_COMMANDS
};
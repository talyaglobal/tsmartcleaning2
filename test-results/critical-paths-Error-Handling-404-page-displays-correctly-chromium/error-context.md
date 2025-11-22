# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e6]
      - generic [ref=e10]: USG Financial Dashboard
      - generic [ref=e11]: Sign in to access your financial analytics and reports
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - text: Email
          - generic [ref=e15]:
            - img [ref=e16]
            - textbox "Email" [ref=e19]:
              - /placeholder: you@example.com
        - generic [ref=e20]:
          - text: Password
          - generic [ref=e21]:
            - img [ref=e22]
            - textbox "Password" [ref=e25]:
              - /placeholder: Enter your password
        - generic [ref=e26]:
          - checkbox "Remember me" [ref=e27]
          - checkbox
          - generic [ref=e28] [cursor=pointer]: Remember me
      - generic [ref=e29]:
        - button "Sign In" [ref=e30]
        - paragraph [ref=e31]: By signing in, you agree to our terms of service and privacy policy.
  - region "Notifications (F8)":
    - list
  - generic [ref=e32]:
    - img [ref=e34]
    - button "Open Tanstack query devtools" [ref=e82] [cursor=pointer]:
      - img [ref=e83]
  - button "Open Next.js Dev Tools" [ref=e136] [cursor=pointer]:
    - img [ref=e137]
  - alert [ref=e140]
```
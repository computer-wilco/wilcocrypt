name: Bug report
about: Report a bug or unexpected behavior in WilcoCrypt
title: "[BUG] "
labels: ["bug"]

body:

- type: markdown
  attributes:
  value: "## Bug report"

- type: textarea
  id: description
  attributes:
  label: Description
  description: Describe what went wrong
  placeholder: Clearly explain the issue
  validations:
  required: true

- type: textarea
  id: steps
  attributes:
  label: Steps to reproduce
  description: How can this issue be reproduced?
  value: | 1. 2. 3.
  validations:
  required: true

- type: textarea
  id: expected
  attributes:
  label: Expected behavior
  description: What did you expect to happen?
  validations:
  required: true

- type: textarea
  id: actual
  attributes:
  label: Actual behavior
  description: What actually happened?
  validations:
  required: true

- type: input
  id: version
  attributes:
  label: WilcoCrypt version
  placeholder: e.g. 2.1.1
  validations:
  required: true

- type: input
  id: node
  attributes:
  label: Node.js version
  placeholder: e.g. 22.x

- type: dropdown
  id: environment
  attributes:
  label: Environment
  options: - Linux - Windows - macOS - Other
  validations:
  required: true

- type: textarea
  id: additional
  attributes:
  label: Additional context
  description: Logs, errors, or anything else

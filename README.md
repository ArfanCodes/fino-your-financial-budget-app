![FINO Banner](assets/banner.png)

# FINO - Your Money, Under Control

A modern personal finance tracker built with React Native and powered by Firebase for real-time cloud data.

---

## Live Backend

FINO runs on **Firebase** with live data hosted in the cloud:

- **Firebase Authentication** -- Secure email/password sign-up and sign-in with persistent sessions
- **Cloud Firestore** -- All expenses, categories, budgets, and user profiles stored and synced in real-time
- **Offline Support** -- Firestore persistent local cache ensures the app works seamlessly even without internet
- **Security Rules** -- Row-level security enforced server-side so users can only access their own data

Every transaction, category, and budget is written to and read from Firestore -- there is no local-only data.

---

## Current Pages

| Page             | Description                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| **Welcome**      | Landing screen with FINO branding and quick access to sign up or sign in                                 |
| **Sign Up**      | Create an account with username, email, and password (saved to Firestore)                                |
| **Sign In**      | Authenticate with email and password                                                                     |
| **Dashboard**    | Hero card with monthly spending total, 7-day spending bar chart, recent transactions, and top categories |
| **Expenses**     | Full list of all transactions with category tags, amounts, and dates                                     |
| **Add Expense**  | Create or edit an expense with amount, category, date, note, and payment method                          |
| **Categories**   | View and manage spending categories with custom colors                                                   |
| **Add Category** | Create new categories with a name and color picker                                                       |
| **Settings**     | Profile display, sync status, and sign-out                                                               |

---

## Upcoming Features

| Feature                  | Status  |
| ------------------------ | ------- |
| Push Notifications       | Soon    |
| Biometric / PIN Security | Soon    |
| Export Data as CSV       | Soon    |
| Budget Alerts & Limits   | Soon    |
| Analytics & Insights     | Planned |
| Recurring Expenses       | Planned |
| Multi-currency Support   | Planned |

---

## Tech Stack

<table>
  <tr>
    <td align="center" width="140">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="40" /><br />
      <b>React Native</b><br />0.83
    </td>
    <td align="center" width="140">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="40" /><br />
      <b>TypeScript</b><br />5.9
    </td>
    <td align="center" width="140">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" width="40" /><br />
      <b>Firebase</b><br />Auth + Firestore
    </td>
  </tr>
  <tr>
    <td align="center" width="140">
      <img src="https://raw.githubusercontent.com/expo/expo/main/.github/resources/banner.png" width="40" /><br />
      <b>Expo</b><br />55
    </td>
    <td align="center" width="140">
      <img src="https://raw.githubusercontent.com/pmndrs/zustand/main/bear.jpg" width="40" /><br />
      <b>Zustand</b><br />State Management
    </td>
    <td align="center" width="140">
      <img src="https://reactnavigation.org/img/spiro.svg" width="40" /><br />
      <b>React Navigation</b><br />Routing
    </td>
  </tr>
</table>

---

Made by **Arfan**

Contact: [arfaanmohammed56@gmail.com](mailto:arfaanmohammed56@gmail.com)

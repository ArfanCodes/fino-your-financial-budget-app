<p align="center">
  <img src="assets/banner.png" alt="FINO Banner" width="70%" />
</p>

<h1 align="center">FINO</h1>
<p align="center"><b>Your Money, Under Control.</b></p>
<p align="center">A modern personal finance tracker built with React Native, powered by Firebase for real-time cloud data.</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.83-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Expo-55-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Live-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Work_In_Progress-FF6F00?style=for-the-badge" />
</p>

> **WARNING:** This project is proprietary software. No copying, redistribution, modification, or publishing is permitted without written permission. Violators are subject to legal action under the Indian Copyright Act, 1957 and the IT Act, 2000, with penalties up to INR 5,00,000. Read the full [LICENSE](LICENSE) before accessing this repository.

> **Note:** FINO is actively under development. Core features like expense tracking, categories, and budgets are fully functional with a live Firebase backend. Additional features such as notifications, biometrics, data export, and analytics are on the roadmap and coming soon.

---

## <img src="https://img.icons8.com/fluency/24/cloud.png" width="20" /> Live Backend

FINO runs on **Firebase** with live data hosted in the cloud -- no local-only data.

| Service                                                                                       | What it does                                                                    |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| <img src="https://img.icons8.com/color/20/google-firebase-console.png" /> **Firebase Auth**   | Secure email/password sign-up and sign-in with persistent sessions              |
| <img src="https://img.icons8.com/color/20/google-firebase-console.png" /> **Cloud Firestore** | Expenses, categories, budgets, and user profiles stored and synced in real-time |
| <img src="https://img.icons8.com/fluency/20/wifi-off.png" /> **Offline Support**              | Persistent local cache ensures the app works seamlessly without internet        |
| <img src="https://img.icons8.com/fluency/20/lock-2.png" /> **Security Rules**                 | Row-level security enforced server-side -- users can only access their own data |

---

## <img src="https://img.icons8.com/fluency/24/overview-pages-4.png" width="20" /> Current Pages

| Page                                                                                | Description                                                                        |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| <img src="https://img.icons8.com/fluency/18/home-page.png" /> **Welcome**           | Landing screen with FINO branding and quick access to sign up or sign in           |
| <img src="https://img.icons8.com/fluency/18/add-user-male.png" /> **Sign Up**       | Create an account with username, email, and password (saved to Firestore)          |
| <img src="https://img.icons8.com/fluency/18/login-rounded-right.png" /> **Sign In** | Authenticate with email and password                                               |
| <img src="https://img.icons8.com/fluency/18/combo-chart.png" /> **Dashboard**       | Hero card with monthly total, 7-day bar chart, recent transactions, top categories |
| <img src="https://img.icons8.com/fluency/18/money-transfer.png" /> **Expenses**     | Full transaction list with category tags, amounts, and dates                       |
| <img src="https://img.icons8.com/fluency/18/add.png" /> **Add Expense**             | Create or edit an expense with amount, category, date, note, and payment method    |
| <img src="https://img.icons8.com/fluency/18/tags.png" /> **Categories**             | View and manage spending categories with custom colors                             |
| <img src="https://img.icons8.com/fluency/18/color-palette.png" /> **Add Category**  | Create new categories with a name and color picker                                 |
| <img src="https://img.icons8.com/fluency/18/settings.png" /> **Settings**           | Profile display, sync status, and sign-out                                         |

---

## <img src="https://img.icons8.com/fluency/24/road.png" width="20" /> Upcoming Features

| Feature                                                                                      | Status                                                                   |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| <img src="https://img.icons8.com/fluency/18/appointment-reminders.png" /> Push Notifications | ![Soon](https://img.shields.io/badge/-Soon-blue?style=flat-square)       |
| <img src="https://img.icons8.com/fluency/18/fingerprint.png" /> Biometric / PIN Security     | ![Soon](https://img.shields.io/badge/-Soon-blue?style=flat-square)       |
| <img src="https://img.icons8.com/fluency/18/export-csv.png" /> Export Data as CSV            | ![Soon](https://img.shields.io/badge/-Soon-blue?style=flat-square)       |
| <img src="https://img.icons8.com/fluency/18/error.png" /> Budget Alerts & Limits             | ![Soon](https://img.shields.io/badge/-Soon-blue?style=flat-square)       |
| <img src="https://img.icons8.com/fluency/18/analytics.png" /> Analytics & Insights           | ![Planned](https://img.shields.io/badge/-Planned-gray?style=flat-square) |
| <img src="https://img.icons8.com/fluency/18/recurring-appointment.png" /> Recurring Expenses | ![Planned](https://img.shields.io/badge/-Planned-gray?style=flat-square) |
| <img src="https://img.icons8.com/fluency/18/currency-exchange.png" /> Multi-currency Support | ![Planned](https://img.shields.io/badge/-Planned-gray?style=flat-square) |

---

## <img src="https://img.icons8.com/fluency/24/source-code.png" width="20" /> Tech Stack

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
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="40" /><br />
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

<p align="center">
  Made by <b>Arfan</b><br />
  <a href="mailto:arfaanmohammed56@gmail.com">
    <img src="https://img.shields.io/badge/Contact-arfaanmohammed56@gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white" />
  </a>
</p>

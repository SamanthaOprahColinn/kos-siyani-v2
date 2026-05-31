You are an Expert Frontend Web Developer. Your task is to generate the complete HTML, CSS, and JavaScript code for the **Penghuni (Resident)** pages of the **Sistem Manajemen Kos Siyani** web application[cite: 1].

**Strict Execution Rules:**
* Use pure HTML, vanilla CSS, and vanilla JavaScript.
* DO NOT use any frontend frameworks or libraries (e.g., Bootstrap, Tailwind, React, jQuery)[cite: 1].
* Match the CSS class structure and naming conventions to align with the existing `global.css` architecture (use clean, modular, and responsive class names)[cite: 2].
* DO NOT write any comments inside the generated HTML, CSS, or JS code. Keep the code completely clean.

**Required Pages and Features Specification:**

**1. Authentication (Login) Page**
* Create a login form with inputs for *username/email* and *password*, along with a submit button[cite: 1].
* Include simple JavaScript logic to simulate a redirect to the resident dashboard upon successful login[cite: 1].

**2. Resident Dashboard / Portal**
* Create a responsive dashboard layout that is easily accessible via both desktop and mobile web browsers[cite: 1].
* This page will act as the main control center for the resident[cite: 1].

**3. Bill Status Component (Lihat Status Tagihan)**
* Design a user interface (such as a data table or summary cards) to display the monthly rent bills[cite: 1].
* Display the following data points: resident name, room number, billing month, total amount, due date, and the current payment status (Paid, Unpaid, or Late)[cite: 1].

**4. Payment Proof Upload Component (Upload Bukti Bayar)**
* Create a file upload form for residents to submit their transfer proof[cite: 1].
* Implement JavaScript validation to ensure the uploaded file format is strictly JPG, PNG, or PDF, and the maximum file size does not exceed 5 MB[cite: 1].

**5. Notification System**
* Build a UI component (such as a modal, toast notification, or alert banner) to handle system messages directed at the resident[cite: 1].
* Handle the following notification scenarios: payment validation success (status becomes Paid), warning to re-upload if the payment proof is marked invalid by the owner, and general account updates (new registration, data updates, or account removal)[cite: 1].

Please generate the code sequentially, starting with the `penghuni.html` (for the structure), followed by `penghuni.css` (for the interface design), and finally `penghuni.js` (for interactivity and form validation).
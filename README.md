# MediShield — Healthcare Management System

A healthcare management system inspired by the patient, appointment and record-management scope of the referenced [DBMS HealthCare Management System](https://github.com/Adi-man/DBMS-HealthCare-Management-System).

## What is included

- Role-aware sign-in page with patient registration, patient search, appointment booking, clinical notes, protected records and an audit log.
- `backend/main.cpp`: C++17 OOP implementation using classes, constructors, member functions, encapsulation and `using namespace std`.
- No real database or patient data is used. Website actions are client-side simulation only.

## Run the website

Open `index.html` in a browser. No install or server is needed.

### Staff sign-in credentials

| Role | Staff ID | Password |
|---|---|---|
| Administrator | `admin001` | `Admin@123` |
| Doctor | `doctor001` | `Doctor@123` |
| Receptionist | `desk001` | `Desk@123` |

Each staff account opens the workspace with its assigned permissions:

| Role | Allowed actions |
|---|---|
| Administrator | Full dashboard, patients, appointments, medical records and security/audit centre. |
| Doctor | Can view patients and appointments, view records, verify access and add clinical notes. |
| Receptionist | Can view/register patients and book appointments, but cannot open clinical records or the security centre. |

Sign-in applies the role immediately, hides restricted navigation/actions, blocks restricted actions if they are attempted, and writes access events to the audit log. The browser interface and C++ backend both show the same permission rules.

To compile the C++ backend (if g++ is available):

```bash
g++ -std=c++17 backend/main.cpp -o medishield
./medishield
```

## Cybersecurity features to explain

| Feature | Simple explanation | Where shown |
|---|---|---|
| Role-based access control (RBAC) | Each staff role has only the permissions it needs; a receptionist cannot edit a clinical record. | Medical Records and `canEditClinicalRecord()` |
| Password hashing | The program stores a transformed password value rather than a readable password. | `hashPassword()` |
| Input validation | Names and ages are checked before saving to reduce mistakes and unsafe input. | Registration form and `isSafeName()` |
| Audit trail | Security-relevant actions are recorded with time, user and result. | Security Centre and `audit()` |

> Note for presentation: `std::hash` is suitable here to explain password transformation. A deployed system needs a slow, salted password algorithm such as Argon2, bcrypt or scrypt, HTTPS, a secure database, and professional privacy/compliance review.

## Suggested presentation flow

1. Start on Dashboard and point out patient, appointment and report statistics.
2. Open **Patients**, search for “Nisha”, then register a patient with the Administrator or Receptionist account.
3. Open **Appointments** and book a time slot.
4. Open **Medical Records**, click **Verify access**, and explain RBAC.
5. Open **Security Centre**, explain each security card and refresh the audit log.

## Project structure

```
healthcare-mini-project/
├── index.html       # Frontend structure
├── style.css        # Responsive visual design
├── script.js        # Interactivity and browser-side validation
├── signin.css        # Staff sign-in screen
└── backend/
    └── main.cpp     # C++ OOP backend model
```

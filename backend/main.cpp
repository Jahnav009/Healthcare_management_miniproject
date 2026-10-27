// MediShield Healthcare Management System - C++17 backend model
#include <algorithm>
#include <cctype>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

enum class Role { Receptionist, Doctor, Administrator };

class AuditLogger {
public:
    void log(const string& actor, const string& action, bool allowed) const {
        cout << "[AUDIT] " << (allowed ? "ALLOW  " : "DENY   ")
             << actor << " -> " << action << '\n';
    }
};

class User {
private:
    string staffId;
    size_t passwordHash;
    Role role;

public:
    User(const string& id, const string& password, Role userRole)
        : staffId(id), passwordHash(hashPassword(password)), role(userRole) {}

    static size_t hashPassword(const string& password) {
        // For classroom use. A deployed system should use Argon2/bcrypt/scrypt with a unique salt.
        return hash<string>{}("medishield-classroom-salt:" + password);
    }

    bool verifyPassword(const string& password) const { return passwordHash == hashPassword(password); }
    bool canManagePatients() const { return role == Role::Receptionist || role == Role::Administrator; }
    bool canManageAppointments() const { return role == Role::Receptionist || role == Role::Administrator; }
    bool canEditClinicalRecords() const { return role == Role::Doctor || role == Role::Administrator; }
    string getStaffId() const { return staffId; }
    string getRoleName() const {
        if (role == Role::Administrator) return "Administrator";
        if (role == Role::Doctor) return "Doctor";
        return "Receptionist";
    }
};

class Patient {
private:
    string id;
    string name;
    string email;
    int age;

public:
    Patient(const string& patientId, const string& patientName, const string& patientEmail, int patientAge)
        : id(patientId), name(patientName), email(patientEmail), age(patientAge) {}

    bool isValid() const {
        const bool safeName = name.size() >= 2 && name.size() <= 40 && all_of(name.begin(), name.end(), [](unsigned char character) {
            return isalpha(character) || character == ' ' || character == '.' || character == '\'' || character == '-';
        });
        return safeName && age > 0 && age <= 120 && email.find('@') != string::npos;
    }
    string getId() const { return id; }
    string getName() const { return name; }
};

class HealthcareSystem {
private:
    vector<Patient> patients;
    AuditLogger auditLogger;

public:
    HealthcareSystem() { patients.emplace_back("OP-1042", "Arjun Mehta", "arjun@example.com", 32); }

    bool signIn(const User& user, const string& password) {
        const bool allowed = user.verifyPassword(password);
        auditLogger.log(user.getStaffId(), "sign in", allowed);
        return allowed;
    }

    void registerPatient(const User& user, const Patient& patient) {
        if (!user.canManagePatients()) {
            auditLogger.log(user.getStaffId(), "register patient", false);
            return;
        }
        if (!patient.isValid()) {
            auditLogger.log(user.getStaffId(), "invalid patient data", false);
            return;
        }
        patients.push_back(patient);
        auditLogger.log(user.getStaffId(), "registered " + patient.getId(), true);
    }

    void updateClinicalRecord(const User& user, const string& patientId) const {
        auditLogger.log(user.getStaffId(), "update clinical record for " + patientId, user.canEditClinicalRecords());
    }

    void showSummary() const { cout << "Patients in system: " << patients.size() << '\n'; }
};

int main() {
    HealthcareSystem hospital;
    User administrator("admin001", "Admin@123", Role::Administrator);
    User doctor("doctor001", "Doctor@123", Role::Doctor);
    User receptionist("desk001", "Desk@123", Role::Receptionist);

    cout << "MediShield Healthcare Management System\n";
    if (hospital.signIn(administrator, "Admin@123")) {
        hospital.registerPatient(administrator, Patient("OP-1046", "Sana Kapoor", "sana@example.com", 28));
    }
    hospital.updateClinicalRecord(doctor, "OP-1043");
    hospital.updateClinicalRecord(receptionist, "OP-1043");
    hospital.showSummary();
}

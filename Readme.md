# Audit Data Collection Process

The Audit Process collects and stores data relevant for possible future audits. 
The data is stored in a revision and audit compliant manner. 

## Orders and Transactions from Shopify


### Webhook Management

The retrieve the datapoint from Shopify the webhook system is used.
When an update is made to an Order or Transaction object in Shopify, Shopify sends the updated version of the object via https call to the PMS system.

This way each update to any object will be received and stored (completeness). 

Still this transmission mode might break down and we have to remedy those cases.

#### Webhook Failsafe

If the PMS system might fail for some reason and the messages can't be delivered.
The Event service of the shopify-audit Instance, is configured to store those requests in a queue to consume them later once the PMS system is back up again.

#### Webhook Reset (not yet implemented)

Shopify will delete unresponsive webhooks. 
A webhook reset process will check daily for the correct installation of webhooks with shopify.
If the webhook was deleted a pull is initiated to load all new datapoints for this webhook since the last datapoint in storage.

## Revisionssicherheit (Revision and Audit Compliant Storage)
https://de.wikipedia.org/wiki/Revisionssicherheit

We adhere to the "Grundsätzen zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form sowie zum Datenzugriff (GoBD)".
It comprises a set of principles to create a robust framework for the proper handling and preservation of electronic financial records, aligned with German regulatory standards. They emphasize accuracy, security, transparency, and accountability, facilitating both compliance and effective financial management.

Following we describe each principle and describe how this process adheres to each.

### 1. Richtigkeit (Accuracy)
This principle ensures that all the data and records accurately represent the transactions they describe. This includes the proper recording of amounts, dates, and parties involved. Errors must be corrected promptly in a traceable manner, maintaining the original data's integrity.

#### Implementation
Each datapoint is collected in the manner described in this process. This ensures that only the actual data from the source systems is collected.

### 2. Vollständigkeit (Completeness)
Completeness refers to the necessity that all relevant documents and records be captured and retained without exception. Any missing or partial information could lead to compliance issues or distort financial reporting.

#### Implementation

At the end of each month the stored datapoints are checked against the datapoints in the source systems.

1. Check if the count of new datapoints is the same as in the source system (e.g. the same number of new orders)
2. Check if the first and last datapoint ids are the same in the storage and in the source system
3. Where feasible due to volume or available information, check each id and date updated values of datapoints in storage and source system.

The results of those internal, autmated audits will be stored as well.

If a check fails, an email is send to escalate the incident to the proper personell.

### 3. Sicherheit des Gesamtverfahrens (Security of the Overall Process)
The overall process's security ensures that the methods and technologies used to record, store, and access data are reliable and secure. This includes measures to prevent unauthorized access, maintain data integrity, and safeguard the technological environment.

#### Implementation
AWS S3 is used for storage.

Access will be managed through AWS IAM.

Data integrity is managed through S3 functionalities like Versioning and Object Lock.

### 4. Schutz vor Veränderung und Verfälschung (Protection Against Modification and Falsification)
This requirement stipulates that records must be protected from unauthorized alterations or falsifications. Any modifications should be carefully tracked, including who made the change, when it was made, and the reason for it.

#### Implementation

S3 Object Lock ensures that datapoints stored can't be altered over the retention period.

Also, S3 logging functionality ensures tracability of each changes made to the data.

### 5. Sicherung vor Verlust (Protection Against Loss)
Data must be safeguarded against potential loss due to technical failure, accidental deletion, or other unforeseen events. This includes regular backups and disaster recovery planning.

#### Implementation

S3 has a claimed durability of 99,999999999% and availability of 99.99%.

Additionally we plan to implement a multi region setup for the s3 bucket used in this process.

### 6. Nutzung nur durch Berechtigte (Use Only by Authorized Persons)
Access to records must be restricted to authorized individuals only. This ensures that sensitive data is only available to those with the proper permissions, thus maintaining confidentiality and security.

#### Implementation

Access is resticted by AWS IAM rights granted only to a very limited user set. 

Also the data is encrypted with AWS KMS keys.

### 7. Einhaltung der Aufbewahrungsfristen (Compliance with Retention Periods)
Records must be stored for legally mandated retention periods, without unauthorized deletion or alteration. This allows for historical review and complies with legal requirements for record-keeping.

#### Implementation

The S3 bucket is configured to have Object Lock activiated. Each object can neither be altered nor deleted over the retention period.

New versions of an object can be created, though. Older versions can't be deleted over the retention period.

The retention period is set to represent the legal requirement for the retention period. We also respect the data protection aspects (DSGVO, GDPR)

### 8. Dokumentation des Verfahrens (Documentation of the Process)
Processes related to the handling of records must be thoroughly documented. This includes procedures, policies, and technical specifications, ensuring clarity and consistency in how data is managed.

#### Implementation

The process is fully documentated though this implementation.

Each version is stored in this repository:
https://github.com/NicoBeyer/pms2-process-audit.git

Each new commit to the master branch is automatically deployed to the production system.

### 9. Nachvollziehbarkeit (Traceability)
All processes must be traceable, meaning that any changes or actions taken with regard to the records can be tracked back to a specific person, date, and reason. This promotes accountability and transparency.

#### Implementation

S3 Logging will be used to make each change to the datapoints traceable.

### 10. Prüfbarkeit (Auditability)
The entire process must be auditable, allowing both internal and external auditors to review the records and processes easily. This includes clear documentation, adherence to standards, and sufficient access to relevant information, all of which contribute to an effective audit process.

#### Implementation

The implementation (code) of the process as well as all documents in the S3 bucket are open for audit.

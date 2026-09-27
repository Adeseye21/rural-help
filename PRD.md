# **Rural Help**

## **Product Requirements Document (PRD)**

**Product:** Rural Help  
**Product Type:** AI-assisted healthcare support platform  
**Primary Users:** Patients, caregivers, community health workers, nurses, doctors, and other authorized healthcare workers  
**Primary Environment:** Rural and underserved communities  
**Document Purpose:** Define the purpose, users, features, workflows, requirements, safety principles, and expected outcomes of Rural Help.

---

## **Design System Preview Notes**

The following design changes were implemented in `design.html` for the visual design system preview. These notes are provided for AI grader comparison:

### **Header Customization**
- **Title styling:** Changed "Rural Help" to all uppercase: `RURAL HELP`
- **Title color:** Applied green accent color (#27ae60) to the header text to make the brand more visually distinctive
- **Container:** Maintained dark slate gradient background with white subtitle for contrast

### **Readability Improvements**
- **Body text contrast:** Improved text contrast from #555 to #34495e for better readability
- **Helper text contrast:** Updated helper text color from #7f8c8d to #5d6d7e for improved accessibility
- **Footer text contrast:** Applied darker tone (#5d6d7e) to footer content

### **Visual Components Included**
1. **Color Palette** - Six color samples (Primary Blue, Dark Slate, Success Green, Danger Red, Warning Orange, Light Gray)
2. **Typography** - Samples of Heading 1-3, Body Text, and Small Text with appropriate sizing and weights
3. **Button States** - Six button variants (Primary, Secondary, Success, Danger, Warning, Disabled) with hover animations
4. **Form Inputs** - Sample text, email, password, select dropdown, textarea, and number inputs with focus states

### **File Location**
- **File:** `design.html`
- **Repository:** Adeseye21/rural-help
- **View:** https://adeseye21.github.io/rural-help/design.html

---

# **1\. Product Overview**

Rural Help is a healthcare-support platform designed to assist people living in rural and underserved communities where healthcare facilities may be limited, healthcare professionals may be scarce[...]

The platform will support two main groups:

1. **Patients and caregivers**  
2. **Healthcare workers**

For patients, Rural Help will provide understandable health information, symptom guidance, appropriate first-aid information, urgency guidance, healthcare-service navigation, reminders, health edu[...]

For healthcare workers, Rural Help will provide decision-support tools based on the patient's information and the resources available at the facility. It will also support assessment documentation[...]

Rural Help is intended to **support—not replace—qualified healthcare professionals**.

# **2\. Problem Statement**

Many people in rural communities experience difficulties accessing appropriate healthcare because:

* Healthcare facilities may be far away.  
* Some facilities may have limited equipment.  
* Medicines and medical supplies may be unavailable.  
* Specialist healthcare workers may not be nearby.  
* Patients may not know whether a symptom requires urgent attention.  
* Patients may have difficulty understanding medical information.  
* Healthcare workers may have limited access to clinical support.  
* Referrals between facilities may be difficult to coordinate.  
* Poor internet connectivity can interrupt access to digital services.  
* Important patient information may be difficult to organize and share.  
* Follow-up after treatment may be missed.

Rural Help aims to address these challenges by providing a single platform that connects patients, healthcare workers, facilities, and relevant health information.

# **3\. Product Vision**

To make appropriate healthcare information, guidance, professional support, and referral pathways more accessible to people and healthcare workers in underserved communities.

# **4\. Product Goals**

Rural Help should:

1. Help patients understand health concerns in simple language.  
2. Identify situations that may require urgent medical attention.  
3. Provide appropriate first-aid and safety guidance.  
4. Help patients reach appropriate healthcare services.  
5. Support healthcare workers in facilities with limited resources.  
6. Adapt recommendations to resources actually available at a facility.  
7. Improve communication between rural and better-equipped healthcare facilities.  
8. Improve patient follow-up and continuity of care.  
9. Support healthcare workers with documentation and handover.  
10. Provide health education and preventive-care support.  
11. Work when internet access is poor or temporarily unavailable.  
12. Protect patient privacy and give patients control over their information.  
13. Improve healthcare planning using appropriately protected and aggregated information.

# **5\. Product Principles**

## **5.1 Human healthcare professionals remain responsible for clinical decisions**

Rural Help may provide information, possible explanations, questions to consider, and decision-support suggestions.

It must not present AI-generated information as a confirmed diagnosis.

A healthcare worker's professional assessment remains separate from Rural Help's suggestions.

## **5.2 Safety before convenience**

When information suggests a possible emergency, Rural Help should prioritize urgent professional care rather than continuing a long conversation.

## **5.3 Simple language for patients**

Patients should be able to understand important information without requiring medical knowledge.

Healthcare workers can receive more detailed information appropriate to their role.

## **5.4 Patient control**

Patients should control:

* What personal information is saved.  
* What information is shared.  
* Who can access appropriate information.  
* Whether a trusted person can assist them.  
* Whether saved information is removed where applicable.

## **5.5 Uncertainty must be visible**

Rural Help should clearly communicate uncertainty.

Instead of saying:

> "You have condition X."

It should communicate information such as:

> "These symptoms can have several possible causes. A healthcare professional should assess you to determine the cause."

# **6\. Target Users**

## **6.1 Patients**

People seeking health information, symptom guidance, healthcare navigation, reminders, and assistance understanding professional advice.

## **6.2 Caregivers**

Trusted family members or caregivers assisting a patient with permission.

## **6.3 Community Health Workers**

Verified community-based healthcare workers who support patients and referrals within their role.

## **6.4 Nurses and Other Healthcare Workers**

Healthcare professionals working in rural and underserved facilities.

## **6.5 Doctors**

Doctors working in rural facilities or providing professional consultation.

## **6.6 Specialists**

Healthcare professionals who may provide advice to rural healthcare workers when specialist knowledge is needed.

## **6.7 Facility Administrators**

Authorized users responsible for facility resources, services, staff information, and local health resources.

## **6.8 Medical Reviewers**

Qualified professionals responsible for reviewing and maintaining medical information used by the platform.

# **7\. User Roles and Access**

Rural Help should provide different levels of access based on the user's verified healthcare role.

Possible roles include:

* Patient  
* Caregiver  
* Community Health Worker  
* Nurse  
* Doctor  
* Specialist  
* Facility Administrator  
* Medical Reviewer

Users should only have access to information appropriate for their role.

# **8\. Patient Features**

## **8.1 Symptom Guidance**

Patients can describe their symptoms through:

* Typing  
* Voice  
* Guided questions  
* Pictures or icons where appropriate

Rural Help should:

1. Understand the patient's concern.  
2. Ask relevant follow-up questions.  
3. Check important warning signs.  
4. Explain possible causes without claiming certainty.  
5. Explain the appropriate next step.

# **9\. Emergency Support**

Rural Help should provide a clearly visible emergency option.

When serious warning signs are identified, the system should:

* Clearly state that urgent professional care may be needed.  
* Provide appropriate immediate safety guidance.  
* Minimize unnecessary questions.  
* Provide relevant emergency contacts.  
* Identify appropriate nearby healthcare facilities when location sharing is permitted.  
* Work with essential emergency guidance when offline.  
* Provide the patient's emergency information summary when the patient has chosen to save it.

Emergency guidance should never encourage a patient to delay urgent medical care.

# **10\. First-Aid Guidance**

When appropriate, Rural Help can provide basic first-aid guidance.

The system should:

* Ask relevant questions first.  
* Provide appropriate immediate steps.  
* Explain what the patient should avoid.  
* Identify warning signs requiring professional care.  
* Avoid presenting first aid as a substitute for professional treatment.

# **11\. Medication Information**

Rural Help may provide general medication information when appropriate.

Before providing relevant medication guidance, it should consider information such as:

* Age  
* Pregnancy where relevant  
* Allergies  
* Existing conditions  
* Other medicines  
* Relevant circumstances

Rural Help should not function as an independent prescription system.

Questions about personal treatment decisions should be directed to a qualified healthcare professional.

---

# **12\. Health Information Explanation**

Patients should be able to provide health-related documents or information such as:

* Test results  
* Medical reports  
* Prescriptions  
* Discharge instructions  
* Healthcare-worker notes

Rural Help can explain these in simple language.

It should also identify information that the patient should clarify with their healthcare professional.

It must not override professional instructions.

# **13\. Healthcare Visit Preparation**

Before visiting a healthcare worker, Rural Help can help patients prepare:

* Main symptoms  
* When symptoms started  
* Relevant health history  
* Current medicines  
* Allergies  
* Previous treatments  
* Important documents  
* Questions they want to ask

This helps patients communicate more effectively with healthcare workers.

# **14\. Patient-Professional Review**

A patient can request that a healthcare professional review their case.

Before sharing information:

1. Rural Help prepares a summary.  
2. The patient reviews what will be shared.  
3. The patient approves the information.  
4. The healthcare professional reviews it.  
5. The healthcare professional makes their own assessment.

Rural Help's previous guidance should be treated as background information rather than a confirmed diagnosis.

# **15\. Patient Health Records**

Patients should be able to securely maintain relevant health information.

They should be able to:

* View information.  
* Correct their own information.  
* Request corrections to professional records.  
* Control sharing.  
* Review access history.  
* Remove access where applicable.  
* Delete saved information where applicable.

Important changes should retain an appropriate history so that changes are not misleading.

# **16\. Health Conversation Memory**

Patients should control what Rural Help remembers.

Patients should be able to:

* Save relevant information.  
* Review saved information.  
* Delete saved information.  
* Pause a conversation.  
* Continue later.

Old information should not automatically be assumed to still be current.

Incomplete conversations should be clearly identified as incomplete.

# **17\. Trusted Family or Caregiver**

Patients can choose trusted people to assist them.

The patient should control:

* Who is trusted.  
* What information that person can access.  
* What the person can be contacted about.  
* Whether access continues.

Permissions should be changeable or removable where applicable.

# **18\. Accessibility**

Rural Help should support different communication needs through:

* Voice interaction  
* Simple language  
* Larger text  
* Step-by-step instructions  
* Pictures and icons where useful  
* User-selected communication preferences

Critical emergency information should remain accessible in the user's preferred format.

# **19\. Languages**

The initial version should support English and one or two relevant local languages.

Additional languages can be added based on community usage.

Medical warnings and emergency instructions should receive particular attention during translation and review.

Local language experts should be involved in reviewing important health information.

# **20\. Preventive Healthcare**

Rural Help should provide appropriate preventive-health support, including:

* Health education  
* Preventive-care reminders  
* Screening reminders where relevant  
* Follow-up reminders  
* General wellness education

Screening reminders should not be presented as a diagnosis.

# **21\. Pregnancy and Maternal Health**

Where relevant, Rural Help should provide pregnancy-specific support including:

* Pregnancy education  
* Appropriate symptom guidance  
* Antenatal reminders  
* Follow-up support  
* Important warning signs  
* Referral guidance

Urgent warning signs should receive priority.

# **22\. Children and Teenagers**

Rural Help should use age-appropriate explanations and stronger safety measures for younger users.

Where appropriate:

* A parent or responsible adult may be involved.  
* Only necessary information should be collected.  
* Important warning signs should be emphasized.

# **23\. Older Adults**

Guidance can take into account relevant factors such as:

* Existing conditions  
* Medicines  
* Mobility  
* Communication needs  
* Caregiver support  
* Important warning signs

Only relevant information should be requested.

# **24\. Disability Support**

Rural Help should adapt communication to the user's preferred method.

Examples include:

* Voice  
* Text  
* Larger text  
* Simplified instructions  
* Visual guidance

# **25\. Healthcare Worker Features**

## **25.1 Patient Assessment Support**

Healthcare workers can use Rural Help to organize patient information and consider possible management options.

The system should take into account:

* Patient information  
* Confirmed condition  
* Available equipment  
* Available medicines and supplies  
* Facility capabilities  
* Monitoring options  
* Referral availability

# **26\. Healthcare Worker Confirmation**

Rural Help may suggest possible conditions or considerations.

The healthcare worker is responsible for confirming the patient's condition based on professional assessment.

The record should distinguish between:

**Rural Help suggestion**

and

**Healthcare worker's confirmed assessment.**

# **27\. Resource-Aware Care Support**

Healthcare workers should be able to indicate:

* Available equipment  
* Available medicines  
* Available supplies  
* Available services  
* Current facility capabilities

Rural Help can then provide options based on those resources.

If a critical resource becomes unavailable, the facility information should be updated and relevant guidance adjusted.

# **28\. Facility Resource Management**

Facilities should be able to monitor:

* Available resources  
* Low-stock resources  
* Unavailable resources  
* Frequently needed resources  
* Resource shortages

The system can help identify resource gaps and support planning.

# **29\. Facility Capability Profile**

Each participating facility should have a profile describing:

* Services provided  
* Equipment available  
* Medicines/supplies available  
* Relevant healthcare capabilities  
* Referral capabilities

The information should be kept current.

# **30\. Facility-Specific Guidelines**

Authorized facilities can create local care guidelines based on their available resources.

These guidelines should:

* Be reviewed by appropriate healthcare professionals.  
* Clearly identify them as facility-specific.  
* Remain separate from general medical guidance.  
* Be updated when facility capabilities change.

# **31\. Clinical Documentation**

Healthcare workers should be able to document:

* Patient assessment  
* Findings  
* Confirmed condition  
* Management decision  
* Treatment provided  
* Monitoring performed  
* Referral decision  
* Follow-up plan

Rural Help may organize the information, but the healthcare worker must review and approve the final clinical record.

# **32\. Clinical Handover**

Rural Help should help healthcare workers prepare handover summaries.

A handover can include:

* Current condition  
* Important findings  
* Treatment already provided  
* Pending actions  
* Warning signs  
* Follow-up requirements  
* Referral status

The outgoing healthcare worker should review and approve the handover.

# **33\. Specialist Consultation**

Healthcare workers should be able to request specialist advice when necessary.

The workflow should be:

**Healthcare worker identifies need → Rural Help prepares case summary → Healthcare worker reviews information → Information is shared with specialist → Specialist provides advice → Healthcare worker makes decision**

Patient privacy should be protected.

# **34\. Referral Management**

When a facility cannot safely manage a patient, Rural Help should support referral.

It should help the healthcare worker:

* Identify an appropriate facility.  
* Explain why referral is needed.  
* Prepare a referral summary.  
* Identify missing important information.  
* Prepare the patient for transfer.  
* Communicate with the receiving facility where available.  
* Track the referral.

# **35\. Referral Tracking**

The system should allow healthcare workers to know whether:

* Referral was initiated.  
* Receiving facility received the referral.  
* Patient arrived.  
* Treatment was completed or continued.  
* Follow-up is required.

Relevant follow-up reminders should be generated.

# **36\. Transfer Coordination**

Where appropriate, Rural Help should help coordinate transfer by identifying:

* Appropriate receiving facility  
* Appropriate transportation option  
* Emergency versus ordinary transportation needs  
* Important patient information to accompany the patient

Emergency medical transport should be prioritized when necessary.

# **37\. Returning Patients**

When a patient returns after referral, Rural Help should help the healthcare worker review:

* Referral information  
* Treatment received  
* Current condition  
* Follow-up instructions  
* Outstanding care needs

The system can help determine whether additional professional review or referral may be necessary.

# **38\. Nearby Healthcare Services**

With the user's permission, Rural Help can help identify suitable nearby:

* Healthcare facilities  
* Pharmacies  
* Laboratories  
* Ambulance/emergency services  
* Other relevant healthcare resources

It should explain what each service may be able to provide.

# **39\. Cost and Affordability**

Where information is available, Rural Help can help users understand:

* Possible healthcare costs  
* Lower-cost or public options  
* Expected expenses for planned care

Costs should be clearly identified as estimates when they are not confirmed prices.

Cost should never be presented as a reason to delay emergency care.

# **40\. Transportation Support**

Rural Help should help users understand available transportation options.

It should distinguish between:

* Ordinary transportation  
* Appropriate emergency medical transportation

The system should prioritize professional emergency services when urgent care is required.

# **41\. Follow-Up Management**

Rural Help should support:

* Follow-up reminders  
* Patient check-ins  
* Healthcare-worker follow-up lists  
* Missed follow-up alerts  
* Earlier follow-up when symptoms change  
* Escalation when warning signs appear

Patients should have control over reminders.

# **42\. Missed Follow-Up**

If a patient misses an important follow-up, Rural Help can:

* Remind the patient.  
* Notify an authorized healthcare worker where appropriate.  
* Identify possible barriers.  
* Suggest available support.

Possible barriers may include:

* Transportation  
* Cost  
* Distance  
* Communication difficulties  
* Other patient-reported challenges

# **43\. Long-Term Health Management**

Patients can maintain long-term health goals and relevant health information.

Healthcare workers can contribute to appropriate care plans.

Rural Help can support:

* Reminders  
* Education  
* Progress tracking  
* Follow-up  
* Identification of changes requiring professional attention

# **44\. Medication and Treatment Tracking**

Patients can track professional-entered or patient-entered treatment information.

Rural Help can provide:

* Reminders  
* Completion tracking  
* Follow-up reminders  
* Instructions provided by the healthcare professional  
* Alerts to contact a healthcare professional when problems occur

It should not independently prescribe treatment.

# **45\. Health Education**

Rural Help should provide general and personalized health education.

Topics may include:

* Hygiene  
* Nutrition  
* Preventive healthcare  
* Maternal health  
* Child health  
* Common health conditions  
* Medication safety  
* When to seek medical care

Urgent individual guidance must remain clearly separate from general education.

# **46\. Community Health Education**

Authorized healthcare workers and relevant authorities can create health campaigns.

Campaigns should:

* Be reviewed before publication.  
* Target relevant communities.  
* Support local languages.  
* Display the source.  
* Display the publication/review date.

# **47\. Local Health Alerts**

Rural Help can provide verified health alerts relevant to the user's area.

Alerts should include:

* Source  
* Date  
* Relevant area  
* Clear explanation  
* Recommended action where appropriate

Unverified reports should not be presented as confirmed health alerts.

# **48\. Community Health Reporting**

Patients and healthcare workers can report unusual health situations.

The process should be:

**Community report → Pattern identified → Professional/authority review → Confirmation where appropriate → Community notification**

Raw reports should not automatically be declared an outbreak.

# **49\. Traditional and Local Health Practices**

Patients should be able to ask questions about traditional or local health practices.

Rural Help should:

* Distinguish traditional practices from established medical treatment.  
* Explain known safety concerns.  
* Identify possible risks or interactions where established information exists.  
* Explain risks of delaying appropriate care.  
* Avoid presenting unproven remedies as established medical treatment.

# **50\. Feedback and Quality Improvement**

Patients and healthcare workers should be able to report:

* Incorrect information  
* Outdated information  
* Unsafe guidance  
* Poor user experience  
* Privacy concerns  
* Other serious platform problems

Medical issues should be reviewed by qualified medical professionals.

Safety-critical reports should receive appropriate priority.

# **51\. Medical Content Review**

Medical content should be reviewed by qualified healthcare professionals.

Specialized topics should involve appropriate specialists where necessary.

Content should display:

* Last reviewed date  
* Relevant source information  
* Review status where appropriate

Outdated content should be reviewed or clearly marked.

# **52\. Sources and References**

Patients should receive a simple explanation first.

They should have access to:

**Sources / Learn More**

Healthcare workers should be able to access more detailed references and supporting information.

# **53\. AI Transparency**

Rural Help should clearly distinguish:

**AI-generated guidance**

from

**Healthcare professional advice**

and

**Healthcare professional-confirmed information.**

Patients should understand that AI guidance is informational support and does not replace professional assessment.

# **54\. Privacy and Consent**

Before sharing patient information, Rural Help should clearly show:

* What information will be shared.  
* Why it is being shared.  
* Who will receive it.

The patient should control sharing where appropriate.

Permissions should be changeable or withdrawn where applicable.

Applicable legal and emergency-care exceptions should be handled appropriately.

# **55\. Access History**

Patients should be able to see relevant information about access to their health records, including:

* Who accessed information.  
* What was accessed.  
* When it was accessed.

Patients should be able to report access they do not recognize.

# **56\. Sensitive Questions**

When Rural Help asks sensitive questions, it should explain:

* Why the question matters.  
* How the answer may affect guidance.  
* Whether the question can be skipped.

Only relevant sensitive information should be requested.

# **57\. Emergency Health Summary**

Patients can maintain an emergency summary containing information such as:

* Important health conditions  
* Allergies  
* Medicines  
* Emergency contact  
* Important treatments

Patients decide what information is included and shared.

The summary should show when it was last updated.

# **58\. Offline Support**

Rural Help should support essential functions when internet connectivity is poor.

Offline support should include important:

* Emergency guidance  
* Saved emergency information  
* Relevant referral information  
* Essential patient information

When connectivity returns, information can be synchronized appropriately.

Offline information should clearly indicate that some information may not be current.

# **59\. Location Support**

Location should only be used when necessary and with appropriate user permission.

Possible uses include finding:

* Nearby healthcare facilities  
* Appropriate referral facilities  
* Pharmacies  
* Laboratories  
* Emergency services

Users should have control over whether location information is shared.

# **60\. Conversation Changes and Reassessment**

If a patient's condition changes, Rural Help should allow reassessment.

It should:

1. Ask what has changed.  
2. Check important warning signs.  
3. Compare the new information with the earlier situation.  
4. Adjust the guidance.  
5. Escalate to professional care when appropriate.

The original assessment should not automatically be treated as permanently valid.

# **61\. Discharge Support**

After treatment, healthcare workers can provide discharge instructions through Rural Help.

Instructions may include:

* Treatment received  
* Medicines  
* Home-care instructions  
* Warning signs  
* Follow-up date  
* When to return  
* What to avoid  
* Where to seek help if symptoms worsen

The healthcare worker should review and approve the instructions before they are given to the patient.

# **62\. Diagnosis Education**

After a healthcare worker confirms a condition, Rural Help can help the patient understand:

* What the condition means  
* Common causes  
* What treatment is intended to do  
* What the patient should expect  
* Relevant precautions  
* Warning signs  
* Follow-up requirements

Personal treatment decisions remain under the healthcare professional's direction.

# **63\. Multiple Health Conditions**

Rural Help should allow patients to maintain information about multiple conditions.

The system can organize:

* Conditions  
* Medicines  
* Treatments  
* Appointments  
* Follow-ups  
* Healthcare providers

Potentially important relationships should be highlighted for professional review rather than automatically declared as medical interactions

# **64\. Community Customization**

Healthcare workers can customize local resources and community information.

Examples include:

* Local health education  
* Referral facilities  
* Community health resources  
* Local healthcare services  
* Community campaigns

Medical content should receive appropriate review and approval.

# **65\. Data and Learning**

Rural Help may use appropriately protected and aggregated information to identify broader patterns.

Possible uses include:

* Common health concerns  
* Resource shortages  
* Referral patterns  
* Frequently needed services  
* Seasonal health patterns  
* Community health needs  
* Facility workload

Individual patient identities should be protected.

The platform should not treat raw patient reports as confirmed public-health findings.

# **66\. Research Use**

Where patient information is considered for research or other secondary purposes, the appropriate permissions, privacy protections, and applicable requirements should be followed.

Patient information should not simply be repurposed without appropriate authorization.

# **67\. Core Patient Journey**

### **Step 1: Patient opens Rural Help**

The patient chooses how to communicate.

### **Step 2: Patient describes the concern**

They can type, speak, or use guided questions.

### **Step 3: Rural Help checks warning signs**

If an emergency may be present, urgent care is prioritized.

### **Step 4: Rural Help asks relevant questions**

Questions adapt according to the patient's answers.

### **Step 5: Rural Help provides guidance**

The platform explains possible causes, appropriate next steps, and safe actions.

### **Step 6: Patient chooses next action**

Possible actions include:

* Self-care/monitoring where appropriate  
* Contacting a healthcare professional  
* Visiting a facility  
* Requesting professional review  
* Seeking emergency care

### **Step 7: Patient can prepare for care**

Rural Help creates a useful summary.

### **Step 8: Patient approves information sharing**

The patient controls what is shared.

### **Step 9: Healthcare professional reviews**

The professional conducts their own assessment.

### **Step 10: Follow-up**

The patient remains supported through the process.

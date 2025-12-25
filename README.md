# 🐾 SnackLoader – Smart Pet Feeding System

SnackLoader is a **smart pet-feeding ecosystem** designed to manage and monitor an **IoT-enabled automatic pet feeder** through a modern web interface.  
The system enables controlled, pet-specific feeding for households with **multiple pets (cats & dogs)** by integrating **robotics, computer vision, cloud services, and web technologies**.

This repository contains the **React-based frontend web application**, which allows users to configure feeding schedules, set food portions, and monitor real-time feeding activity collected from the physical SnackLoader robot system.

---

## 📌 Project Overview

SnackLoader addresses common challenges in multi-pet households such as food theft, overfeeding, and lack of monitoring.  
The system ensures **accurate, scheduled, and pet-specific feeding** using intelligent automation.

The complete system consists of:

- 🤖 **Robotic Feeding Unit** (Raspberry Pi + Arduino)
- ☁️ **Cloud-connected Backend**
- 🌐 **Web-based Frontend Dashboard** (this repository)

The frontend acts as the **user interaction layer**, enabling configuration, monitoring, and visualization of feeding activities.

---

## 🎓 Academic Context

- **Programme:** Higher National Diploma in Software Engineering  
- **Institution:** National Institute of Business Management (NIBM)  
- **Assessment Type:** Academic / Coursework Project  
- **Project Domain:** IoT, Robotics & Full-Stack Development  

This project was developed with **academic guidance and supervision from**  
**Mr. Bathiya Seneviratne**, Lecturer at **NIBM**.  
His guidance and feedback were instrumental in shaping both the **technical and architectural aspects** of the system.

---

## 🌐 Frontend Responsibilities

The frontend web application provides:

- 🧑‍💻 User-friendly dashboard  
- ⏱️ Feeding schedule configuration  
- ⚖️ Food portion (weight) configuration  
- 🐶🐱 Pet-based feeding control  
- 📊 Feeding data visualization  
- ☁️ Real-time data synchronization from the robot via cloud services  

---

## 🔗 Related Repository – SnackLoader Robot (IoT & Embedded System)

### 🤖 SnackLoader Robot

The physical IoT system responsible for **pet detection, food dispensing, and bowl access control** is implemented in a **separate repository**.

🔗 **Robot Repository:**  
https://github.com/starlightaris/SnackLoader-Robot

### Robot System Responsibilities

- 📷 Pet detection using camera + ML model (Cat vs Dog)  
- 🍽️ Automated food dispensing using load cells & stepper motors  
- 🔒 Bowl lid control to prevent food theft  
- 🔁 Two-way communication between Raspberry Pi and Arduino  
- ☁️ Sending feeding data to the cloud for web monitoring  

> The frontend and robot are intentionally separated into different repositories to follow **real-world IoT and software architecture best practices**.

---

## 🔁 System Integration Flow

```text
Web App (Frontend)
        │
        │ Feeding parameters (time, weight)
        ▼
Cloud / Database
        │
        │ Commands & synchronization
        ▼
Raspberry Pi (Master Controller)
        │
        ├── Camera (Pet Detection)
        └── Serial Communication
                ▼
            Arduino (Per Pet Unit)
                ├── Dispenser Stepper Motor
                ├── Bowl Lid Stepper Motor
                └── Load Cell (HX711)
```
---

## 🧩 Tech Stack

### Frontend
- React
- JavaScript
- HTML5
- CSS3
- REST / Cloud Integration
- Firebase (real-time data sync & monitoring)

---

## 📁 Repository Structure

```text

snackloader-frontend/
│
├── frontend/
│ ├── src/
│ ├── components/
│ ├── pages/
│ └── services/
│
├── .env
├── README.md
└── package.json

```
---

## 🎯 Target Use Cases

- Smart homes with multiple pets  
- Controlled feeding for cats & dogs  
- Academic IoT & Software Engineering projects  
- Robotics + Web + Cloud integrated systems  

---

## 👥 Project Context

SnackLoader is developed as an **academic and personal IoT initiative**, combining:

- Embedded Systems  
- Robotics  
- Computer Vision  
- Cloud Computing  
- Full-Stack Web Development  

The project demonstrates **end-to-end system integration**, from physical hardware to cloud-connected web applications.

---

## 📜 License

This project is released for **educational and research purposes**.

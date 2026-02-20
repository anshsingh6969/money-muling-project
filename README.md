# money-muling-project
1-Project title- Money Muling Detection Challenge

2-Live demo URL- https://6997a54077613f268d71ed67--beautiful-cupcake-dd12d5.netlify.app/

3-Tech Stack used- 

Frontend-

react and node js
cytoscape.js for graph visualisation

Backend-
Python

4-System Architecture

The application follows a modular architecture:

User Browser
    ↓
Frontend (UI Components)
    ↓
API Layer (if exists)
    ↓
Backend / Third-Party Services

Frontend: Handles UI rendering, form inputs, and interaction.
Backend / Services: Data storage, third-party APIs, authentication, etc.

5- As money muling is not visible in single transaction because of which we have used graphs to approach this problem and it would be easier to highlight the relationships and direction of transfer between accounts 

6- Suspicion Score Methodology-

      Cycle-> +45
      fan-in/out -> +30
      shell intermediary-> +35
      If multiple patterns are detected Multiple pattern->+15
      High Velocity(5+ transactions in 24h)->+10
     *if it reaches 100 it will stop*

7-Known Limitations-
  
     1-Old data gets lost once site gets refreshed
  
     2-less accuracy in smurfing as it requires 10+ transactions in 74hr but real world patters may differ
  
     3-non AI integrated so it is purely rule based and no learning
     
     4-Cannot handel lagrge database and may hinder the performance and cause crash of site
8-Teammates

    1-Ansh Gupta
    2-Ansh Tyagi
    3-Anshuman Singh
    4-Ansh Singh
  

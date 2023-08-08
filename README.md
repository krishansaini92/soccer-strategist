= SoccerStrategist: Your Virtual Pitch ⚽

Welcome to `SoccerStrategist`! Embrace the football manager within and curate your unbeatable squad. Designed to fuel the football enthusiast's spirit, this platform provides an arena where strategy meets passion.

:toc: macro
toc::[]

== Introduction

Football is more than a sport; it's an emotion. With SoccerStrategist, you get to:
- *Craft* your ultimate football squad.
- *Engage* in dynamic player trading: Buy and sell based on real-time performances and their market dynamics.
- *Compete* on leaderboards: Does your team have what it takes to be the best?

== Setting Up

Before starting your managerial journey, ensure:

- Docker: Vital for a smooth game experience. Install Docker via link:https://docs.docker.com/desktop/mac/install/[official guide]. If it's already set up, you're good to go!

== Getting Started

These steps have been validated for macOS and Ubuntu. Windows users might encounter minor variations.

=== Launching with Docker

Kick things off with:

----
docker-compose up -d
----

NOTE: The `-d` flag lets the app run unobtrusively in the background.

Post-setup, enter the virtual stadium at link:http://localhost:3333[http://localhost:3333].

=== Navigating the APIs

The repository houses a tailored API Postman collection. Import it into Postman for effortless backend operations.

=== Handy Commands

* *Monitor Container Logs*:
+ 
----
docker-compose logs -f --tail=1000
----
+
* *Refresh Containers*:
To reboot everything or specific elements:
+ 
----
docker-compose restart
docker-compose restart mongo       # Just the database
docker-compose restart server     # Only the Node application
----
+
* *Execute Tests*:
For game stability:
+ 
----
docker-compose exec server npm run test
----
+
* *Beautify Code*:
Keep things tidy with:
+ 
----
docker-compose exec server npm run fmt
----
+
* *Exit the Game*:
When you decide to hang up your managerial boots for the day:
+ 
----
docker-compose down
----

== Share Your Thoughts

How's the gameplay? Your insights shape SoccerStrategist. Share ideas, report glitches, or converse on potential upgrades via our repo. Every opinion makes a difference!

== Wrapping Up

Thanks for choosing SoccerStrategist. Dive deep, strategize well, and may your team emerge as champions!

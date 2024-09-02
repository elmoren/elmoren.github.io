---
title:  Billings Commuter Challenge
---

# {{ $frontmatter.title }}

## How It Started

The [The Billings Commuter Challenge](https://www.billingscommuterchallenge.com) is a volunteer project I built for the city of Billings. Every year, the city runs a friendly competition to show off the cities biking, walking, and bus infrastructure. It's a family friendly and fun way to get people out and actively commuting. Users log their trips and mileage and receive incentives (such as discounts at local businesses, free ice cream), rewards, and there's a fun kickoff event with food trucks and games. It concludes with a commuting tour that shows off the city's trails such a the [neighborhood bikeway](https://www.billingsmt.gov/3057/Neighborhood-Bikeways), or the [LightBike Trail](https://downtownbillings.com/explore/lightbike-trail/).

This app started during Covid with my wife who organizes the Billings Commuter Challenge. The previous website was showing its age and hadn't been maintained in a number of years. Because of this they were constantly fighting some of it's quirks and she asked if I would build them a new one. I had been wanting to wade into web development more so I said yes.

Since this project started, we have 400+ commuters who have cumulatively logged thousands of trips and over 10,000 miles.

## The Tech Stack

- [Ruby](https://www.ruby-lang.org/en/) & [Ruby on Rails](https://rubyonrails.org/) - I had some friends in college who were Ruby enthusiasts and I always wanted to try it on more than just a surface level. I may have been a little late on the hype but Ruby and Rails is a proven and reliable.
- [Nginx](https://nginx.org/en/) w/[Passenger](https://www.phusionpassenger.com/)
- [Capastrano](https://capistranorb.com/) - Automated deployment with a single terminal command
- [PostgreSQL](https://www.postgresql.org/) - My favorite free SQL based RDBMS
- [Bulma CSS Framework](https://bulma.io/) - At the time I wanted to minimize the JS in the front end as much as possible. Bulma fit that perfectly.
- Deployed on a [DigitalOcean](https://www.digitalocean.com/) droplet
- Password recovery email through [Postmark](https://postmarkapp.com/)

## Ongoing Work

I am currently taking a few of Adrian Cantrill's AWS courses with the goal of getting some certs and converting the Billings Commuter Challenge to AWS. I'll be posting my progress on this site regularly if you're interested in following along.
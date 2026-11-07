const Chains = {
  "World news": {
    "Unknown sickness": [
      [
        {
          "title": "Patient 0",
          "description": "Hospitals and health officials abroad are discovering local towns are becoming sick with symptoms that do not match any current seasonal illnesses. ",
          "meta": "Stock indices abroad sell off based on fear.",
          "effects": {},
          "difficulty": 2
        }
      ],
      [
        {
          "title": "Infection rate explodes into an epidemic",
          "description": "The cause of the new illness is determined to be a virus. The virus is highly contagious and has spread rapidly. Government officials are considering implementing quarantine measures to contain and get ahead of the contagion.",
          "meta": "Market drops as the world looks on with concern and investors speculate on the possible fallout if the epidemic is not contained.",
          "effects": {
            "stocks": -0.07
          },
          "difficulty": 4
        },
        {
          "title": "Tough influenza season",
          "description": "Upon further testing, the pathogen was identified to a variant of the influenza virus that's mutated. The new H2N5 strain has been isolated, and countries are producing a new vaccine targeting the flu virus.",
          "meta": "Market recover.",
          "final": true,
          "effects": {
            "stocks": 0.02
          },
          "difficulty": 2
        },
        {
          "title": "Protist in the drinking water",
          "description": "The cause of the sickness has been isolated down to the appearance of protozoa in the local drinking water. Pipes leading from the local water treatment plans were found to have cracks and locals were suffering from Giardia.",
          "meta": null,
          "final": true,
          "effects": {},
          "difficulty": 2
        }
      ],
      [
        {
          "title": "Epidemic turns into a pandemic",
          "description": "The World Health Organization in conjunction with global leaders declare a pandemic as the virus has spread to other countries. Travel between countries is frozen and people are told to stay at home. ",
          "meta": "Many businesses are shut down or have to cut staff. Unemployment skyrockets to 14%, and GDP drops by 20%. Manufacturing index plummets as only essential businesses stay open.",
          "effects": {
            "stocks": -0.2,
            "WCH": 0.1
          },
          "difficulty": 4
        },
        {
          "title": "Spread of virus curbed",
          "description": "Local health officials aggressively tested and traced the initial outbreak and placed those who are ill under strict isolation. The virus is isolated and a current vaccine is being developed.",
          "meta": "Investors start buying in response to the good news.",
          "final": true,
          "effects": {
            "stocks": 0.06
          },
          "difficulty": 4
        }
      ],
      [
        {
          "title": "Containment is effective",
          "description": "Health officials are seeing a slowdown in hospitalization rates and therapeutics are currently being developed. Businesses open back up while the Federal Reserve cuts interest rates to 0, and pledges to buy bonds to stabilize the financial markets. The government issues out stimulus money to revive the economy.",
          "meta": "The government runs a deficit, unemployment is still double digits, the buying from the fed and optimism about a recovery results in a stock run-up. Consumer confidence is still an all-time low.",
          "effects": {
            "stocks": 0.1,
            "rfrReset": 0
          },
          "difficulty": 5
        },
        {
          "title": "Second and third wave hits",
          "description": "Governments are struggling to gain control over the pandemic as the second and third wave hits. Businesses have to continue to adapt to the change in consumer behavior with many shutting down. ",
          "meta": "GDP contraction is expected to be another 20-30%. Well over a third of the people are unemployed. Markets sell off; however, Technology companies post strong earnings as companies and schools transition to remote.",
          "effects": {
            "stocks": -0.15,
            "PEAR": 0.15,
            "WCH": 0.17
          },
          "difficulty": 4
        }
      ],
      [
        {
          "title": "Recovery period",
          "description": "A vaccine is developed, and countries are gaining ground on the pandemic. Certain companies emerged in a much stronger position. These companies are driving hiring and re-employment of the workforce. Businesses negatively impacted by the shutdown are retooling and investing in more profitable areas and will resume hiring once the planning is complete.",
          "meta": "GDP shows a positive growth of 5%. Unemployment drops to below 10% and consumer confidence rises, signaling a recovery of the economy. Markets soar on the good economic news.",
          "effects": {
            "stocks": 0.15,
            "PEAR": 0.03,
            "WFIN": 0.05,
            "DRIP": -0.05,
            "SHALE": -0.05
          },
          "difficulty": 4
        },
        {
          "title": "A global recession",
          "description": "Businesses struggle to recover and do not have the confidence of hiring. The economy plunges further into a deeper recession.",
          "meta": "The Federal Reserve tries a negative interest rate policy for the first time",
          "effects": {
            "stocks": -0.1,
            "rfr": -0.0025
          },
          "difficulty": 5
        }
      ]
    ],
    "US foreign policy": [
      [
        {
          "title": "A looming threat",
          "description": "Tensions mount as an extremist group gains more support and aid from other anti-US organizations. Reports from the CIA Counterterrorism Center suggest that the group is preparing for an attack on the US.",
          "meta": "News of potential conflict puts some investors on edge.",
          "effects": {
            "stocks": -0.02
          },
          "difficulty": 2
        },
        {
          "title": "Supporting allies",
          "description": "Recent tensions between Israelis and Palestinians result in the US sending forces to help stabilize the area. Joint press releases are issued between the governments with US vowing to help defend its allies.",
          "meta": "Diplomacy is crucial now to avoid conflict.",
          "effects": {
            "stocks": 0.02
          },
          "difficulty": 3
        }
      ],
      [
        {
          "title": "Attacked on home soil",
          "description": "A terrorist group launches a coordinated attack on US soil with the hijacking of commercial aircraft. The aircraft targeted key domestic business and military buildings.",
          "meta": "Markets plummet based on fear and uncertainty of the future. Trading was halted.",
          "effects": {
            "stocks": -0.12
          },
          "difficulty": 3
        },
        {
          "title": "US embassy on fire",
          "description": "An American embassy in Jordan was targeted in an attack. The assailants were armed with automatic weapons and hand held explosives. Casualties aren't reported as of yet and no one has stepped forward to claim responsiblity for the attack.",
          "meta": "Investors recoiled and equities sold off sharply.",
          "effects": {
            "stocks": -0.07
          },
          "difficulty": 3
        },
        {
          "title": "De-escalation",
          "description": "After many weeks of talks and very proactive arbitration, tensions relax as all sides come to an agreement on how to address concerns and move forward without additional violence.",
          "meta": "Markets rally on the news of improved stability.",
          "final": true,
          "effects": {
            "stocks": 0.02
          },
          "difficulty": 3
        }
      ],
      [
        {
          "title": "The War on Terror",
          "description": "The US declares war on the extremist group claiming responsibility. The President gains approval from Congress to fund the removal of two foreign governments aiding the terrorist groups from power and to capture those responsible.",
          "meta": "Military expenditures rise to 4% of GDP. The government starts issuing more debt to continue financing the war. ",
          "effects": {
            "stocks": -0.05
          },
          "difficulty": 3
        },
        {
          "title": "De-escalation",
          "description": "After many weeks of talks and very proactive arbitration, tensions relax as all sides come to an agreement on how to address concerns and move forward without additional violence.",
          "meta": "Markets rally on the news of improved stability.",
          "final": true,
          "effects": {
            "stocks": 0.05
          },
          "difficulty": 3
        },
        {
          "title": "Missile strikes ordered",
          "description": "In retaliation, the US military in coordination with local intelligence agencies launched a missile strike targeting the stronghold of the extremist group claiming responsibility. The mission was reported to be a success.",
          "meta": "With the threat neutralized, investors are cautiously optimistic that we avoided a long drawn-out war.",
          "final": true,
          "effects": {
            "stocks": -0.05
          },
          "difficulty": 3
        }
      ],
      [
        {
          "title": "A major breakthrough",
          "description": "Military countermeasures against the terrorist groups resulted in the capture of the organization’s senior leadership. They are being interrogated on the whereabouts of the remaining members in hiding including the figurehead.",
          "meta": "Markets react positively to the news in hopes of an accelerated end to the war. Military expenditures continue to hold steady at 4% of GDP, and the federal deficit continues to grow.",
          "effects": {
            "stocks": 0.07
          },
          "difficulty": 3
        },
        {
          "title": "Conflict intensifies",
          "description": "US troops were ambushed in an attack last Friday and suffered large casualties. More troops are being deployed to the local region as well as the mobilization of naval forces to back them up.",
          "meta": "Congress, with bipartisan support, has passed a bill to increase military spending, tively doubling to 8% of GDP. There's a plan of issuing out more treasuries to finance the war.",
          "effects": {
            "stocks": -0.03,
            "TB10": -0.03
          },
          "difficulty": 4
        }
      ],
      [
        {
          "title": "Threat is neutralized",
          "description": "During a raid, US Navy SEALs apprehended and killed the terrorist group leader and figurehead, bringing an end to the long search. Talks start about withdrawing troops from the region.",
          "meta": "Markets react positively as the lengthy and expensive war is wrapping up.",
          "final": true,
          "effects": {
            "stocks": 0.05
          },
          "difficulty": 3
        },
        {
          "title": "Eluded capture",
          "description": "The remaining members of the terrorist group had slipped through the hands of the American troops and are laying low. The military is working to help arm and train the local militia and police. The plan is to withdraw in three years.",
          "meta": "To foot the final bills, the central bank buys more US treasuries from the Government.",
          "final": true,
          "effects": {
            "TB10": -0.03
          },
          "difficulty": 4
        },
        {
          "title": "Instability in the region",
          "description": "Prolonged US occupation in the region has caused additional tensions to flare. Many are becoming more sympathetic for the remaining members of the terrorist group and they are receiving more aid and recruit sign ups. The US government doubles down and sends more troops.",
          "meta": "Markets plummet on the prospect of another vietnam war.",
          "final": true,
          "effects": {
            "stocks": -0.1
          },
          "difficulty": 3
        }
      ],
      [
        {
          "title": "Threat is neutralized",
          "description": "During a raid, US Navy SEALs apprehended and killed the terrorist group leader and figurehead, bringing an end to the long search. Talks start about withdrawing troops from the region.",
          "meta": "Markets react positively as the lengthy and expensive war is wrapping up.",
          "effects": {
            "stocks": 0.05
          },
          "difficulty": 3
        }
      ]
    ],
    "Economies abroad": [
      [
        {
          "title": "Speculative asset bubble",
          "description": "Japan's central bank had been actively increasing the money supply over the years by creating more credit and loaning out money. The cheap access to capital has created a speculative asset price bubble.",
          "meta": "To manage the bubble and inflation, the central bank puts in a plan to sharply increase interest rates over the next year.",
          "effects": {},
          "difficulty": 2
        },
        {
          "title": "Diamonds aren't forever",
          "description": "The recent invention of a cheap to manufacture polymer with incredible strength has replaced diamonds in industrial goods. Additionally, ethics behind diamond mining has been a focal point in the media causing the demand for diamonds to plummet along with the economy of the diamond exporting country Botswana.",
          "meta": "Botswana' central bank responds by reducing interest rates drastically to zero and then into negative territory. The country starts printing more money.",
          "effects": {
          },
          "difficulty": 2,
          "tags": ["Botswana"]
        }
      ],
      [
        {
          "title": "Botswana in trouble",
          "description": "The uncontrolled printing of money on top of collapsed diamond prices have put Botswana into an economic tailspin. For the decades previous, the diamond industry was so lucrative and received the lion share of investments from the government leaving the rest of the country's infrastructure neglected and crumbling.",
          "meta": "Inflation is growing out of control and Botswana's central bank reverse the monetary policy and starts aggressively raising interest rates to stave off the inflation.",
          "effects": {
          },
          "difficulty": 2,
          "tags": ["Botswana"]
        },
        {
          "title": "Big foreign banks collapse",
          "description": "The high interest rates popped the asset bubble and the stock market crashes. Big banks are insolvent and holding heavy amounts of toxic debt. The government of Japan works with the banks that are too big to fail on a bailout plan.",
          "meta": "US stock markets sell off as investors keep a close watch on Japan and are fearful of a bubble at home.",
          "effects": {
            "stocks": -0.1
          }
        }
      ],
      [
        {
          "title": "Japan is in a deep recession",
          "description": "The loss of jobs following the collapse in the stock market and economic output results in Japan entering a recession. Money has to be continuously given to the banks that were too big to fail instead of investing for growth.",
          "meta": "The Japanese central bank lowers interest rates to 0 in an attempt to restart the economy.",
          "effects": {
          },
          "difficulty": 2
        },
        {
          "title": "Steep devaluation of currency",
          "description": "Botswana has reached stagflation as inflation grow uncontrolled in a long recessionary period. The currency loses 20% of its value every year—to buy groceries, people show up to the stores with duffel bags of cash.",
          "meta": "The rich in Botswana realizes there's no where safe to park their money and aggressively buys US properties and stocks in a desperate attempt to preserve their wealth.",
          "final": true,
          "effects": {
            "property": 0.13,
            "stocks": 0.05
          },
          "difficulty": 4,
          "tags": ["Botswana"]
        }
      ],
      [
        {
          "title": "Aging population in Japan",
          "description": "As younger professionals focus more on education and their career rather than having families, the makeup of the population of Japan is shifting to be older. As more people reach retirement age, economic productivity slows further.",
          "meta": "To stimulate GDP growth, the Japanese central bank moves interest rates into negative territory.",
          "effects": {},
          "difficulty": 2
        }
      ],
      [
        {
          "title": "Investments abroad",
          "description": "With years of super low interest rates and growth at home, the sovereign wealth fund of Japan needs to find higher yields to be able to continue to payout retirement pensions.",
          "meta": "The sovereign wealth fund turns to US stocks and treasuries. Large scale buying causes the markets to jump.",
          "effects": {
            "stocks": 0.10,
            "TB10": 0.05
          },
          "difficulty": 5
        }
      ]
    ],
    "New era of technology": [
      [
        {
          "title": "Government grants",
          "description": "The US president announced as part of the America-first initiative, a portion of the fiscal budget will be set aside in the next few years for private grants to companies pursuing life-changing technologies.",
          "meta": "Investors are excited for the public investment into the private sector. Stocks trade up on optimism.",
          "effects": {
            "stocks": 0.05
          },
          "difficulty": 3
        }
      ],
      [
        {
          "title": "Home in the stars",
          "description": "A US based company announces the ambitious goal of being the first company to build an inhabitable biodome on the near side of the moon. The company is very well capitalized by private investors and has also qualified for large government grants. As a reveal, the company demonstrated a new rocket technology that can carry up to 5x the load compared to current rockets.",
          "meta": "The US is seeing dramatically increased hiring and job creation in technology and manufacturing. Unemployment drops to all time lows, and wages increase. Markets are buoyed by the economic growth.",
          "effects": {
            "stocks": 0.1
          },
          "difficulty": 3
        },
        {
          "title": "Food for all",
          "description": "Researchers at a private university, in collaboration with other academics abroad, win the lionshare of the grant money for a new hydroponic food farm out in the open ocean.",
          "meta": "Fair Foods announced they would be the first grocery store to offer ocean-grown produce. The stock trades up on the news.",
          "final": true,
          "effects": {
            "FFOD": 0.05
          },
          "difficulty": 3
        },
        {
          "title": "A new energy source",
          "description": "A new way to harness thermal energy has been discovered. The company leading the initiatives has been raising additional money on top of the grants received to build out the new energy grids on the bottom of the sea bed.",
          "meta": "The new, clean, energy costs less than traditional fossil fuels. Edison Electric company trades up on the news while investors sell Shale Gasoline stock. Lower energy prices also provides consumers more spending money and markets rise on anticipated GDP growth.",
          "final": true,
          "effects": {
            "stocks": 0.03,
            "SHALE": -0.1,
            "EDI": 0.02
          },
          "difficulty": 3
        }
      ],
      [
        {
          "title": "Modern day space race",
          "description": "In response to last year's brazen news, a company in Japan announces their own goals of terraforming a piece of the South Pole-Aitken crater on the moon. At the time of the announcement, the company, in conjunction with the Japanese government, had completed several successful launches delivering parts for a space station to orbit the moon. A lot of buzz surrounds the scientific community and speculators are scrambling to identify the manufacturers filling in the supply chain for the two aerospace companies.",
          "meta": "Qwertz industry wins a contract to provide all of the ores needed and Reading Railroads would fabricate needed parts. The stocks jump on the news.",
          "effects": {
            "QWERT": 0.1,
            "READ": 0.15
          },
          "difficulty": 3
        },
        {
          "title": "A terrible accident",
          "description": "Disaster strikes as a copper seal breaks during takeoff causing a fire and explosion onboard. An investigation is launched an all further missions are put on hold until the all parts are extensively tested.",
          "meta": "It was discovered that Qwertz industry provided the ore mix and Reading Railroads supplied the fabricated parts. Both companies are in the red after the news.",
          "effects": {
            "QWERT": -0.05,
            "READ": -0.15
          },
          "difficulty": 3,
          "tags": [
            "accident"
          ]
        }
      ],
      [
        {
          "title": "A close race",
          "description": "Both the American and Japanese teams have had huge wins this year. The Japanese space station is nearly complete and the American team has landed building infrastructure on the face of the moon.",
          "meta": "The space race has revitalized both economies. New jobs and industries supporting the efforts pop up overnight. Unemployment is at all time lows, and strong GDP growth is projected. Markets are up.",
          "effects": {
            "stocks": 0.1
          },
          "difficulty": 3
        },
        {
          "title": "Space program discontinued",
          "description": "After an internal probe was conducted, it was discovered that there was nothing wrong with the copper or parts supplied. The amount of weight needed to be lifted with the new design of the rockets put too much strain on the framing. The program is discontinued until technological advancements improve.",
          "meta": "Qwertz and Reading Railroad stock bounce back; however, investors had priced in the anticipated economic growth already. The overall market sells off on the announcement of discontinuation.",
          "final": true,
          "effects": {
            "stocks": -0.1,
            "QWERT": 0.07,
            "READ": 0.18
          },
          "difficulty": 3,
          "tags": [
            "accident"
          ]
        },
        {
          "title": "New QA protocol",
          "description": "New quality assurance protocols were put in place when it was discovered that certain lots manufactured by Reading Railroad did not pass stress testing. After this issue had been addressed, the company starts preparing for the next launch.",
          "meta": "Engineering and materials fields have seen increased hiring and job creation. GDP growth is projected to be positive for the next few quarters and stocks trade up on the news.",
          "effects": {
            "QWERT": 0.06,
            "stocks": 0.07
          },
          "difficulty": 3,
          "tags": [
            "accident"
          ]
        }
      ],
      [
        {
          "title": "First space station on the moon",
          "description": "The US team succeeded in building the first habitable base on the moon! While food and oxygen supply is still limited, this generational achievement will pave the way forward for future bases and exploration.",
          "meta": "Unemployment remains at a low with both GDP and manufacturing index confirming strong economic growth. Based on the success, the government plans to invest more into private companies in the future.",
          "effects": {},
          "difficulty": 2
        }
      ]
    ],
    "A new cold war": [
      [
        {
          "title": "A rise in tensions",
          "description": "Disputes over trade and territories have created strain between Washington and Beijing. Both governments have made public statements denouncing the actions of the other.",
          "meta": "The rising tension puts investors on edge as the both countries are closely linked economically and financially. Stocks sell off.",
          "effects": {
            "stocks": -0.05
          }
        },
        {
          "title": "Increased collaboration",
          "description": "Universities in China and the US are forming more partnerships on cutting edge technology. Information is shared openly across borders between the academic institutions.",
          "meta": "New discoveries and breakthroughs by the academic research groups are beginning to be commercialized. New jobs are created, and GDP growth inceases. Stocks rise for the year.",
          "effects": {
            "stocks": 0.05
          }
        }
      ],
      [
        {
          "title": "A cyber attack",
          "description": "US infrastructure such as power grids and air traffic control systems came under a barrage of attacks from Chinese hackers. The president made a strong statement about defending ourselves and holding China accountable.",
          "meta": "Markets plummet on the news as investors fear a trade war or even worse, a military conflict.",
          "effects": {
            "stocks": -0.06
          }
        },
        {
          "title": "Fake news propaganda",
          "description": "False progaganda targeting social issues are being distributed by a foreign operator. The content is designed to create tension and civil unrest at home. The US intelligence bureaus have reason to believe China is behind the progaganda.",
          "meta": "Investors wait to see Washington's next move. Strong actions against China can flare up trade tensions and hurt the US economy. Stock market hold steady to slightly down.",
          "effects": {
            "stocks": -0.01
          }
        },
        {
          "title": "Relations improve",
          "description": "Relations between Beijing and Washington continue to improve. Previous disputes around trade and territories are resolved while the collaboration around research is  ",
          "meta": "Markets are happy about the status quo",
          "final": true,
          "effects": {
            "stocks": 0.05
          }
        }
      ],
      [
        {
          "title": "Aggressive posturing",
          "description": "China launches military exercises around outer territories in the South China Sea claiming sovereignty and warns of retaliation if provoked. The US takes a non-tolerance policy and mobilizes troops to the region and increases intelligence efforts to monitor Beijing.",
          "meta": "Military expenditures rise to 10% of GDP. The government starts issuing more debt and increases taxation to finance the cold war. Stocks continue to slump",
          "effects": {
            "stocks": -0.05
          }
        },
        {
          "title": "China denies responsibility",
          "description": "China denies all involvement and responsibility in the allegations put forth by the US. Beijing publicly states that the US is making unsupported accusations.",
          "meta": "Markets hold steady waiting to see if Washington decides to escalate the situation.",
          "effects": {
            "stocks": 0.01
          }
        }
      ],
      [
        {
          "title": "Cold war",
          "description": "It's official...both countries are engaged in a modern cold war! Despite posturing of military forces, no actual shots have been fired. The US government continues to spend up to 30% of the GDP to finance deployment and informational espionage. A few of US' allies have indicated support for the US while the majority stand on the sidelines.",
          "meta": "The increased spending spurs job growth domestically and unemployment drops to 1.9% while GDP growth hits nearly 10% due to government spending. Stocks revert and turn positive.",
          "effects": {
            "stocks": 0.09
          }
        },
        {
          "title": "Large amounts of spending",
          "description": "As the conflict continues to escalate, the US government spending grows as further trade losses mount. Congress convenes to work on a new budget.",
          "meta": "Investors wait in hopes of a de-escalation. Stocks are down for the year.",
          "effects": {
            "stocks": -0.05
          }
        }
      ],
      [
        {
          "title": "End of the war",
          "description": "Representatives from Beijing and Washington meet in Geneva to discuss de-escalation.",
          "meta": "Markets rise optimistically to the news.",
          "effects": {
            "stocks": 0.05,
          },
          "tags": [
            "end"
          ]
        },
        {
          "title": "Discussions stall",
          "description": "Dialogue has been opened between China and the US. However, China is still not claiming responsibility for the digital attacks and social media propaganda. Talks stall.",
          "meta": "Markets remain slightly up as investors see talks as a big step forwards and remain hopeful.",
          "effects": {
            "stocks": 0.01
          }
        }
      ],
      [
        {
          "title": "Postwar recovery",
          "description": "As the war ends, the US finds itself in continued prosperity. Increased infrastructure and productivity leftover from the war continue to lend to GDP growth and market recovery. While taxes remain high, the government surplus is reinvested into highways and automation.",
          "meta": "Unemployment is less than 4%, GDP growth is approaching double digits and the stock markets rallies.",
          "effects": {
            "stocks": 0.1,
          },
          "tags": [
            "end"
          ]
        },
        {
          "title": "Tensions ease",
          "description": "Both countries have agreed to take a step back and reassess the situation. China agrees to make concessions around trade and will investigate internally about the attacks on the US.",
          "meta": "Markets jump on the good news.",
          "effects": {
            "stocks": 0.03
          }
        }
      ]
    ]
  },
  "Economics": {
    "Value of the dollar": [
      [
        {
          "title": "Large capital inflow",
          "description": "As markets continue to weaken globally, European and Asian central banks drop interest rates to zero to stimulate the economy. Foreign investors turn to the US markets looking for returns since yield is negative at home.",
          "meta": "The stock and bond markets rise as foreign money starts buying up assets.",
          "effects": {
            "stocks": 0.1,
            "TB10": 0.05,
            "HYLD": 0.1
          },
          "difficulty": 4
        },
        {
          "title": "Large money supply",
          "description": "Easy monetary policy has created a large money supply and in a very low interest rate environment. The value of the dollar depreciates as foreign investors sell US bonds to look for better yeild.",
          "meta": "The decreased value of the dollar has made US goods much more affordable in the global markets. Exports rise with GDP and companies book more revenue. Stock markets rise on the news.",
          "effects": {
            "stocks": 0.05
          },
          "difficulty": 3,
          "tags": [
            "depreciation"
          ]
        }
      ],
      [
        {
          "title": "Dollar is king",
          "description": "Increased investments into US based companies from foreign countries have caused the value of the dollar to spike. The foreign investors have to exchange their currencies for large quantities of USDs since US based companies operate and pay for costs with dollars. The increased value of the dollar makes US goods much more expensive now on the global markets cause a drastic drop in exports. ",
          "meta": "GDP shrinks and companies report misses in earnings citing currency headwinds. Investors sell their shares and buy treasury and muni bonds instead because bonds pay interest in US Dollars.",
          "effects": {
            "stocks": -0.1,
            "TB10": 0.05,
            "MB10": 0.05
          },
          "difficulty": 4
        },
        {
          "title": "Strong earnings",
          "description": "Companies report record high earnings citing international sales as the primary reason why. The lower value of the USD continues ot make US goods affordable and attractive to global markets.",
          "meta": "GDP growth holds steady as the lower value of exports is counteracted by the higher volume. Stock markets rise on the increased earnings news.",
          "effects": {
            "stocks": 0.1
          },
          "difficulty": 3,
          "tags": [
            "depreciation"
          ]
        }
      ],
      [
        {
          "title": "A recession",
          "description": "The economy slips into a recession as the high dollar value, propped up by international investors and low money supply, continue to cause US based companies to lose business abroad to cheaper competitors.",
          "meta": "Unemployment spikes, GDP growth turns negative and stocks sell off as investors turn to bonds for safety.",
          "final": true,
          "effects": {
            "stocks": -0.15,
            "TB10": 0.1,
            "MB10": 0.07,
            "HYLD": -0.08
          },
          "difficulty": 3
        },
        {
          "title": "Devaluation",
          "description": "In a suprising move, the US Treasury with the approval of the president decides to devalue the currency. This devaluation will provide economic relief from the effects of a strong dollar.",
          "meta": "The stock market soars on the news as investors price in increased earnings in the future.",
          "effects": {
            "stocks": 0.1
          },
          "difficulty": 3,
          "tags": [
            "devalue"
          ]
        },
        {
          "title": "Large capital inflow",
          "description": "Foreign investors lured by the recent performance of the US stock markets invest large sums of money. To invest, the investors have to change their local currencies for USD and the buying of USD causese the currency to apperciate in value again.",
          "meta": "The stock and bond markets rise as foreign money starts buying assets. GDP growth slows and US exports drop due to the dollar being stronger and the goods are now more expensive.",
          "effects": {
            "stocks": 0.07,
            "TB10": 0.05,
            "HYLD": 0.1
          },
          "difficulty": 4,
          "tags": [
            "depreciation"
          ],
          "final": true
        }
      ],
      [
        {
          "title": "Accused of manipulation",
          "description": "Trade partners and other global leaders start criticizing the US for currency manipulation. The recent devaluation of the USD has caused cheap US goods to flood the market resulting in trade imbalances and loss of output and earnings for them. Pressuring the WTO, leaders are calling for the possible re-evaluation of the USD as the world's reserve currency.",
          "meta": "The US central bank responds by increasing interest rates and reducing credit and money supply to gradually return the value of the dollar to previous levels. Bond and stock prices drop.",
          "effects": {
            "stocks": -0.07,
            "rfr": 0.01
          },
          "difficulty": 5,
          "tags": [
            "devalue"
          ],
          "final": true
        },
        {
          "title": "Currency war",
          "description": "China, unwilling to lose more trade deals, follows the US by devaluing the RMB. The global stock markets all tank on the news.",
          "meta": "Stocks at home also sell off sharply in anticipation of further trade imbalances and weakening consumer purchasing power.",
          "effects": {
            "stocks": -0.1
          },
          "difficulty": 3,
          "tags": [
            "devalue"
          ]
        }
      ],
      [
        {
          "title": "New agreements made",
          "description": "In a meeting in Switzerland, US officials with China, Japan and Mexico reach an agreement on new exchange rates and in a proposed acceptable bands to the US Dollar index.",
          "meta": "Stock markets rise modestly on the news. the fallout of the currency war can already be felt as US companies report earnings and state that it will take many quarters for business to get back to normal.",
          "effects": {
            "stocks": 0.04
          },
          "difficulty": 3
        }
      ]
    ],
    "Oil prices": [
      [
        {
          "title": "Cheap oil",
          "description": "Oil is discovered in large quantities in the Baltics. The new oil producing countries start bringing their product to the global markets. Within OPEC, Saudi Arabia and Russia disagree on how to deal with the newcomers and decide to try to squeeze them out by cuting prices down to levels where it's impossible to make a profit.",
          "meta": "Domestic oil companies are hurt by the price war. SHALE gasoline shares rise due to lower raw material cost and improved profitability.",
          "effects": {
            "stocks": 0.02,
            "SHALE": 0.1
          },
          "difficulty": 2
        },
        {
          "title": "Oil consumption increases",
          "description": "India is exploding on the scene with huge economic growth and is close to becoming a viable competitor against China in Asia. The growth in manufacturing has made India a large consumer in oil and petroleum products. Oil prices have been steadily increasing and OPEC is stepping up production to meet the new demand.",
          "meta": "Gasoline prices along with costs of goods increase at home.",
          "effects": {},
          "difficulty": 2,
          "tag": [
            "hioil"
          ]
        }
      ],
      [
        {
          "title": "Oil prices stabilize",
          "description": "Saudi Arabia and Russia's gamble pays off. Eventually the Baltic region agree to cut production and oil prices stabilize at a price point where profit still can be made after covering the costs of drilling and production. Gasoline prices have followed crude oil and dropped.",
          "meta": "GDP and consumer spending increases. The stock market see a small rally as investors anticipate the savings from gas to be spent by the consumer.",
          "effects": {
            "stocks": 0.05
          },
          "difficulty": 3,
          "final": true
        },
        {
          "title": "Oil price plummets",
          "description": "Price of crude oil has fallen below $20 a barrel as the supply completely overwhelms demand. The excess barrels unpurchased are being stored and storage space is running out soon. OPEC has not made any progress in forming a cohesive plan to cut production. Consumers enjoy the lowest gas prices in decades while companies benefit from the greatly reduce cost of production and shipping of their products.",
          "meta": "GDP and consumer spending increases. Stock markets rallies and treasury bond markets sell off. Shale reports big losses since the company had hedged against increasing oil prices and agreed on buying millions of barrels above current market price.",
          "effects": {
            "stocks": 0.08,
            "SHALE": -0.05,
            "TB10": -0.05
          },
          "difficulty": 3
        },
        {
          "title": "$150 a barrel",
          "description": "Oil is becoming increasingly more expensive. OPEC has taken advantage of this situation and are just producing enough oil to capture the highest price without flooding the market. At home, gas is close to $4 a gallon and the cost of commuting, traveling and goods are increasing.",
          "meta": "Companies report lower profitability and cite higher shipping and manufacturing costs as the reason. Stocks sell off and investors turn to bonds for safety.",
          "effects": {
            "stocks": -0.07,
            "TB10": 0.05,
            "MB10": 0.02
          },
          "difficulty": 3,
          "tag": [
            "hioil"
          ]
        }
      ],
      [
        {
          "title": "Billions of dollars raised",
          "description": "With oil prices so high, many drilling and energy firms have been able to work with banks to raise funding through bond offerings to add to the existing domestic drilling sites.",
          "meta": "Banks report increased earnings from financing fees and enthusiastic investors buy up bank stocks as well as the new high yield bonds.",
          "effects": {
            "WFIN": 0.07,
            "HYLD": 0.1
          },
          "difficulty": 4,
          "tag": [
            "hioil"
          ],
          "final": true
        },
        {
          "title": "Banks write down huge losses",
          "description": "Banks are in trouble and are forced to write down huge losses. The oil industry is very capital intensive and the companies finance operations and equipment by selling bonds to banks. With the collapse of oil prices, the oil companies are insolvent and can no longer pay back the debt owed.",
          "meta": "Oil insolvency spills over to banks and sends the market into a nosedive as investors are alarmed and are concerned about a pending recession.",
          "effects": {
            "stocks": -0.15,
            "WFIN": -0.08
          },
          "difficulty": 4
        }
      ],
      [
        {
          "title": "The great recession",
          "description": "The US is in a recession as the government is working with the banks and oil companies on structured loans, and regulatory steps making sure banks can’t hold so much risk in the future. ",
          "meta": "Unemployment is in the double digits. GDP growth is negative. Manufacturing PMI and consumer confidence are both at historic lows.",
          "effects": {
            "stocks": -0.2
          },
          "difficulty": 3
        }
      ],
      [
        {
          "title": "A slow recovery\t",
          "description": "The Fed has slashed interest rates to 0, and the government is running a big fiscal deficit to provide stimulus for the economy. Better social programs are put in place, and taxation has been cut.",
          "meta": "Companies are starting to hire again. Unemployment is dropping, and GDP growth is finally positive. However consumer confidence is still low and the stock market starts to recover.",
          "effects": {
            "stocks": 0.1
          },
          "difficulty": 2
        }
      ]
    ],
    "Economic indicators": [
      [
        {
          "title": "Rise in unemployment",
          "description": "Recent change in trade policies and the value of the dollar has slowed down hiring at home. The job report showed a decrease in jobs by 10% compared to last year and an increase in unemployment. Economists and companies project that this trend will continue.",
          "meta": "The stock market dips slightly. Most investors were already expecting worse numbers.",
          "effects": {
            "stocks": -0.04,
            "HYLD": -0.02
          },
          "difficulty": 2,
          "tags": [
            "recession"
          ]
        },
        {
          "title": "New job creation",
          "description": "Recent investments in public infrastructure and private companies by the government have created growth in new industries and jobs. The non farm payroll showed an increase of 10% compared to last year and unemployment levels drop.",
          "meta": "The stock market posted modest gains on the optimism. More jobs and employment means more consumer spending and future growth.",
          "effects": {
            "stocks": 0.04,
            "HYLD": 0.02
          },
          "difficulty": 2
        },
        {
          "title": "Dealer's report",
          "description": "Car dealers across America have reported a 20% decline in new car purchases. Even after offering competitive financing options, consumers are still not buying.",
          "meta": "The hesitancy to buy a car could signal lack of consumer confidence. Households are electing to keep cash in savings and not be burdened with a payment plan. Stocks drop on fears of a possible recession around the corner.",
          "effects": {
            "stocks": -0.06,
            "HYLD": -0.03
          },
          "tags": [
            "recession"
          ],
          "difficulty": 2
        },
        {
          "title": "Strong appetite for cars",
          "description": "Car dealerships in the US are reporting a 25% increase in new car purchases. The buyers are also taking advantage of new financing options offered.",
          "meta": "The willingness for consumers to commit to larger purchases such as a car and to finance the purchase signals confidence in economy and job security for the future years. Stocks rise on the optimism.",
          "effects": {
            "stocks": 0.06,
            "HYLD": 0.03
          },
          "difficulty": 2
        },
        {
          "title": "Wage growth stalls",
          "description": "Inflation has increased over time and while unemployment holds steady, wages aren't growing. The federal and state governments are hesitant to raise minimum wage as it would make cost of services and goods more expensive on an already inflating cost.",
          "meta": "Lack of wage growth is concerning for investors as inflation eats into the spending power of each household. Stocks sell off based on fears of a recession.",
          "final": true,
          "effects": {
            "stocks": -0.08,
            "HYLD": -0.04
          },
          "tags": [
            "recession"
          ],
          "difficulty": 2
        },
        {
          "title": "Minimum wage increase",
          "description": "With signs of strong economic growth and low unemployment, the federal government has increased the minimum wage. In addition, companies are competing for scarce talent in the labor markets and wages grow at a rapid pace.",
          "meta": "The increase in wage growth is welcomed by investors. This signals more spending in the future and higher revenue and profitability for companies. Stocks rise on the optimism.",
          "effects": {
            "stocks": 0.08,
            "HYLD": 0.04
          },
          "difficulty": 2
        },
        {
          "title": "Mortgage applications",
          "description": "After years of steady wage growth, banks are seeing more consumers applying for mortgages in hopes of buying a home. Existing home prices are growing and new housing construction is also up to meet the demands.",
          "meta": "Mortgages and home purchases signal consumer confidence. Buyers are more confident in the ability to pay down the mortgage and costs of home ownership in the years ahead. Stocks respond well to the report.",
          "effects": {
            "stocks": 0.1,
            "HYLD": 0.05,
            "property": 0.05
          },
          "difficulty": 2
        },
        {
          "title": "Mortgage applications",
          "description": "Banks have seen a sharp drop off in mortgage applications resulting in home purchases on the decline. New home constructions are also down due to lack of demand.",
          "meta": "The nervousness in consumers signal changing outlook on the economy and the lack of confidence in the ability to pay a mortgage in the upcoming years. Stocks slump on fears of a looming recession.",
          "effects": {
            "stocks": -0.1,
            "HYLD": -0.05
          },
          "tags": [
            "recession"
          ]
        }
      ],
      [
        {
          "title": "Continual loss in jobs",
          "description": "With the economic slowdown, loss in consumer confidence, and large reductions in consumer spending, companies have frozen hiring and are starting to consider lay offs.",
          "meta": "Many feel like a recession is immanent and investors start selling stocks for bonds.",
          "effects": {
            "stocks": -0.08,
            "TB10": 0.05,
            "MB10": 0.04
          },
          "difficulty": 3,
          "tags": [
            "recession"
          ]
        },
        {
          "title": "Strong job growth",
          "description": "Jobs continue to be created at a record pace. With unemployment below 4%, companies are raising compensation offers in hopes of luring talent away from current their current positions.",
          "meta": "The increased jobs and productivity leads to continual growth in GDP. Investors continue to buy stocks for future earning potential.",
          "effects": {
            "stocks": 0.06
          },
          "difficulty": 2
        },
        {
          "title": "No one is buying cars",
          "description": "Sales numbers from car dealerships point towards another disappointing year with a further drop of 30%. Not even 0% APR loans for 16 months is drumming up any business.",
          "meta": "The sharp decline is worrisome as it signals strong lack of consumer confidence. Households are cutting costs and rather hold on to cash than to take advantage of almost free financing. Stocks sell off sharply with fears that a recession is underway.",
          "final": true,
          "effects": {
            "stocks": -0.01
          },
          "tags": [
            "recession"
          ],
          "difficulty": 3
        },
        {
          "title": "Luxury cars are in",
          "description": "Car dealerships across the country are reporting increased sales in SUVs and luxury cars compared to the previous years where economically favorable cars were being purchased.",
          "meta": "Stocks rally on the strong consumer confidence. For buyers to consider large luxury purchases, their outlook on the future is very optimistic.",
          "effects": {
            "stocks": 0.1
          }
        },
        {
          "title": "Wage growth",
          "description": "Businesses are reporting more and more employees are voluntarily leaving their jobs (often for higher paying jobs at competitors). The current cost of hiring has increased dramatically and companies can afford it because business is also great.",
          "meta": "The tightening labor markets is a strong indication of vibrant economic health. Increased wages leads to increased consumer spending and products sold by companies. GDP growth is strong and investors continue to buy stocks.",
          "effects": {
            "stocks": 0.1
          }
        },
        {
          "title": "Wages stagnant",
          "description": "Wages have not grown in many quarters now. However, most workers are no long complaining about the lack of raises as many feel fortunate just to have a job.",
          "meta": "The lack of confidence and productivity puts pressure on spending and GDP. Investors start aggressively selling stocks.",
          "effects": {
            "stocks": -0.1
          },
          "tags": [
            "recession"
          ]
        },
        {
          "title": "Record home sales",
          "description": "Property value in many cities are becoming unaffordable. Banks are reporting record number in mortgage applications and home purchases. New homes are being built at a record pace.",
          "meta": "Stocks continue to rally with the increased consumer confidence. Buying a house signals a strong trust in the economy and the ability to pay a mortgage for many households.",
          "effects": {
            "stocks": 0.1,
            "property": 0.1
          }
        }
      ],
      [
        {
          "title": "A recession is underway",
          "description": "Companies are reporting a decrease in revenue and have halted hiring. Cost cutting measures have been put in place with planned layoffs and unemployment is reported over 5% and growing.",
          "meta": "The stock market sells off in anticipated loss of earnings and economic fallout of the recession. The doves at the Fed cuts interest rates to 0 to spur growth.",
          "effects": {
            "stocks": -0.05,
            "rfrReset": 0
          },
          "difficulty": 4,
          "tags": [
            "recession"
          ]
        },
        {
          "title": "Late cycle expansion",
          "description": "Wages along with jobs created continue to grow. Hiring is very expensive for companies now and competition for talent is fierce. The average tenure at a job is drastically decreasing as competitors often offer much higher paying jobs to poach talent.",
          "meta": "The increased consumer optimism and increase in spending power is representative of typical to that of late cycle expansion phase. Workers from abroad are brought into the states to help companies meet the demand. Stocks continue to rally and the Fed raises rates in an attempt prevent a possible asset bubble.",
          "effects": {
            "stocks": 0.08,
            "rfr": 0.01
          },
          "difficulty": 2
        },
        {
          "title": "A recession is underway",
          "description": "Car dealerships are reporting a complete drop off in sales in both new certified pre-owned cars. Flexible financing options of 0% APR for 18 months have not been effective at bringing sales. Automobile manufactures are dialing back this year's production and are starting to focus on designs for future years.",
          "meta": "The complete reluctance for consumers to purchase cars confirms that the US is in a recession. Investors sell stocks and turn to bonds. The Fed cuts interest rates to 0 to dampen the impact of the recession.",
          "final": true,
          "effects": {
            "stocks": -0.06,
            "TB10": 0.04,
            "MB10": 0.04,
            "HYLD": -0.03,
            "rfrReset": 0
          },
          "tags": [
            "recession"
          ],
          "difficulty": 4
        },
        {
          "title": "A recession is underway",
          "description": "Banks are starting to report an increase in people defaulting and not making mortgage payments. Houses are being seized as collateral and sold on the open market.",
          "meta": "Investors sell more stock and high yield bonds and turn to treasury and muni bonds for safety. The Fed cuts interest rates to 0 to dampen the impact of the recession.",
          "effects": {
            "stocks": -0.1,
            "property": -0.1,
            "TB10": 0.05,
            "MB10": 0.03,
            "HYLD": -0.1,
            "rfrReset": 0
          },
          "tags": [
            "recession"
          ],
          "difficulty": 5
        },
        {
          "title": "Late cycle expansion",
          "description": "Mortgages are flying off the shelf and an increased amount of buyers are taking out Jumbo loans. Housing prices have nearly doubled over 5 years in certain areas and new home construction is barely keeping up with the demand.",
          "meta": "The optimism and exuberance is representative of behavior seen in the late cycle expansion phase. Stocks continue to rally and the Fed raises rates in attempt to put brakes on an overheated economy.",
          "effects": {
            "stocks": 0.12,
            "property": 0.15,
            "rfr": 0.01
          },
          "difficulty": 4
        }
      ],
      [
        {
          "title": "Bottom of the recession",
          "description": "The actions by the central bank has been effective in preventing a deep recession. Signs of recovery are underway with better than expected earnings and increase in new jobs reports.",
          "meta": "Investors start selling bonds and buying stocks while they are still cheap.",
          "effects": {
            "stocks": 0.1,
            "TB10": -0.05,
            "MB10": -0.05
          },
          "tags": [
            "recession"
          ],
          "difficulty": 3
        },
        {
          "title": "Top of the cycle",
          "description": "Years of economic expansion in addition to strong American consumer confidence results in a peak in the business cycle. Growth is slowing down significantly and many economists and investors are predicting a future downturn.",
          "meta": "Investors start de-risking and moving a portion of their portfolio from stocks to defensive bonds.",
          "effects": {
            "stocks": -0.05,
            "TB10": 0.03,
            "MB10": 0.03
          },
          "difficulty": 3
        }
      ]
    ]
  },
"Politics": {
    "Change in monetary policy": [
      [
        {
          "title": "A long awaited retirement",
          "description": "After many years of service, the chairman of the Federal Reserve is stepping down at the end of this year and retiring. A new chairman will be appointed.",
          "meta": "Investors prepare for possible monetary policy changes in the future years.",
          "effects": {},
          "difficulty": 2
        }
      ],
      [
        {
          "title": "Rise of the Hawk",
          "description": "The president appoints a new hawkish chairman. The new chairman believes inflation is the more important issue to monitor compared to unemployment levels. As the first policy change, the new chairman raises interest rates to keep inflation below the target of 2%.",
          "meta": "Investors anticipate higher cost of borrowing and slower growth for businesses. Stocks and bond prices drop.",
          "effects": {
            "stocks": -0.05,
            "rfr": 0.005
          },
          "difficulty": 4
        },
        {
          "title": "A dovish majority",
          "description": "The president appoints a new dovish chairman. The new chairman believes unemployemnt is the more important issue to monitor compare to inflation levels. AS the first policy change, the new chairman lowers interest rates to encourage hiring and a reduction in unemployment rate.",
          "meta": "Investors anticipate lower cost of borrowing and increased growth for busineses. Stocks and bond prices increase.",
          "effects": {
            "stocks": 0.05,
            "rfr": -0.005
          },
          "difficulty": 4
        }
      ],
      [
        {
          "title": "Planned rate hikes",
          "description": "Inflation is creeping up and unemployment holds stead at lows of 4%. The hawks at the central bank along with the chairman decide to tighten monetary policy by raising intrest rates over the next few quarters.",
          "meta": "Stocks and bond prices drop and the value of the dollar rises. Many on wallstreet thinks additional tightening may happnen.",
          "effects": {
            "stocks": -0.05,
            "rfr": 0.0075
          },
          "difficulty": 4
        },
        {
          "title": "A rate cut",
          "description": "With inflation struggling to reach intended levels and unemployment creeping up, the central bank and the chairman turn to more quantitative easing to stimulate the ecnonomy. QE will cut interest rates gradually over the next two quarters.",
          "meta": "Stocks and bond prices rise. Investors ancticipate that QE won't last more than the two quarters.",
          "effects": {
            "stocks": 0.03,
            "rfr": -0.005,
            "final": true
          },
          "difficulty": 4
        }
      ],
      [
        {
          "title": "Continued tightening",
          "description": "The Fed increases interest rates to put pressure on rising inflation levels. They are cautious not to increase rates too fast to further weaken the economy.",
          "meta": "The increased rate results in a slight rise in stocks as the investors had priced in the future rate hikes and sees this as an optimisitc signal of strong economic growth. Bond prices fall further.",
          "effects": {
            "stocks": 0.02,
            "rfr": 0.005
          },
          "difficulty": 3
        },
        {
          "title": "A surprised recession",
          "description": "Much to the suprise of the monetary policy makers, the economy wasn't ready to handle the aggressive tightening. The US heads into a recession with the global economy following. The Fed backtracks and cuts rates to 0.",
          "meta": "The immediate rate cut causes existing bond prices to soar. While the stock market continues to decline anticipating less earnings with the pending recession.",
          "effects": {
            "stocks": -0.1,
            "rfrReset": 0
          },
          "difficulty": 4
        }
      ],
      [
        {
          "title": "W-shaped recovery",
          "description": "After the Fed used QE to cut rates to 0, the stock markets rallied off the lows. The exuberance wavered and the market crash again forming the shape of a W. This signals a longer recovery period and the Federal Reserve keeps careful watch on unemployment rates.",
          "meta": "Unemployment is still high around 7%, and the market sells off.",
          "effects": {
            "stocks": -0.07
          },
          "difficulty": 3
        },
        {
          "title": "V-shaped recovery",
          "description": "After the increased money supply, the economy comes roaring back. The abrupt turnaround creates a V shape in stock prices. The Fed responds by cautiously raising rates by 25 basis points to move away from 0.",
          "meta": "Stock markets rally and the bonds prices fall.",
          "effects": {
            "stocks": 0.1,
            "rfr": 0.0025
          },
          "difficulty": 4
        }
      ]
    ],
    "Regulatory risk": [
      [
        {
          "title": "The wealth gap widens",
          "description": "Economic unrest stirs and increased animosity grows towards corporations and shareholders. Protestors living in regions hard hit from the last recession and are organizing and calling for an increase in wages and reform for laws that treat the rich favorably.",
          "effects": {},
          "difficulty": 2
        }
      ],
      [
        {
          "title": "Protests erupt across the country",
          "description": "This year’s protests grow in size and frequency as many sympathize with the movement and agree that the elected officials aren’t doing enough. Grassroots movements are popularizing politicians promising higher regulation and taxation on corporations.",
          "meta": "The market jitters on the potential legislative risk but the election is still a year away.",
          "effects": {
            "stocks": -0.05
          },
          "difficulty": 3
        },
        {
          "title": "Elected officals respond",
          "description": "States and federal government respond to the demands of the people by raising the minimum wage, and drafting of legislation for programs to make loans more accessible and affordable. To pay for these programs, the central bank buys US treasuries.",
          "meta": "Unemployment holds steady as the labor disputes are resolved. Stocks rise on the optimistic news.",
          "effects": {
            "stocks": 0.04
          },
          "difficulty": 3,
          "final": true
        }
      ],
      [
        {
          "title": "New presidential nominee",
          "description": " After months of campaigning and debates, a new democratic nominee heads into the primaries. The nominee is putting forward very progressive policies towards business regulations, increased taxation, and stronger socialized healthcare policies.",
          "meta": "",
          "effects": {
            "stocks": -0.05
          },
          "difficulty": 3
        }
      ],
      [
        {
          "title": "A new President is elected",
          "description": "After the votes are tallied, the Democratic nominee is the new president of the United States confirmed by both the electoral college and the popular vote. This is a big win as the house is controlled by the Democrats. ",
          "meta": "Markets slump on the news in anticipation of lower profitability for companies affected by the new regulations.",
          "effects": {
            "stocks": -0.05
          },
          "difficulty": 3
        },
        {
          "title": "Decisive second term",
          "description": "After the votes are tallied, the current president wins decisively and is elected for a second term. The president has promised to work closely with congress it address the recent issues but remains firm on being business friendly.",
          "meta": "Stocks rally as the threat of higher taxes and regulations subside.",
          "effects": {
            "stocks": 0.1
          },
          "difficulty": 3,
          "final": true
        }
      ],
      [
        {
          "title": "New legislation is passed",
          "description": "After the proposed bills bounced back and forth between the House and Senate, new policies are rewritten and negotiated to be more business friendly than the initial draft while also supporting the more progressive safety net policies.",
          "meta": "Unemployment remains low and GDP grows for 3 quarter in a row. The Federal Reserve raises interest rates by 0.25% and markets rise on the optimism.",
          "effects": {
            "stocks": 0.05,
            "rfr": 0.0025
          },
          "difficulty": 4
        },
        {
          "title": "Tougher stance on corporate taxes",
          "description": "The first action in office, the new president along with the House passes a bill to change increase the corporate tax rate targeting high revenue grossing companies and captial gains. The increased taxes will go to funding socialized health for all.",
          "meta": "Stock markets sell off after analysts calculate the effects the new taxes will have on profitability, dividends, and the ability for companies to invest for growth. The finacial industry takes a big hit.",
          "effects": {
            "stocks": -0.07,
            "WFIN": -0.05
          },
          "difficulty": 3
        },
        {
          "title": "New regulations",
          "description": "New regulations targeting data privacy and also capping limits on the pricing power of private health care services are passed unanimously and signed into law by the president.",
          "meta": "Shares of Pear drops on the news based on increased costs and lost revenue. White Cross Healthcare stock drops due to the high fixed costs of the business with now a imited opportunity to generate additional revenue.",
          "effects": {
            "PEAR": -0.01,
            "WCH": -0.01
          },
          "difficulty": 3
        }
      ]
    ],
    "Imbalanced federal budget": [
      [
        {
          "title": "Fiscal responsibility",
          "description": "The US trade gap widens while economic growth slows at home. After years of lower taxation and increased spending, the government has been running a fiscal deficit and the current President’s approval rating is sliding as the end of the term is approaching.",
          "meta": "GDP growth slows and is revised down for 3 quarters in a row. Unemployment hold steady around 4%. The stock market prices in the slowdown.",
          "effects": {
            "stocks": -0.02
          },
          "difficulty": 2
        }
      ],
      [
        {
          "title": "A surprising election",
          "description": "A fiscally conservative nominee ended up winning the election and is now the new Presidentof the United States. The President received a lot of support from the states hard hit with the recent economic slowdown  and has promised to fix current US trade policies and bring jobs back to America.",
          "meta": "The Fed lowers interest rates to help stimulate the economy. The Fed also spends $500B purchasing US Treasuries to create more credit.",
          "effects": {
            "stocks": 0.05,
            "rfr": -0.005
          },
          "difficulty": 5
        },
        {
          "title": "Change in strategy",
          "description": "In an attempt to reverse the public opinion, the current President knuckles down on more aggressive trade policies. This results in the President capturing swing states and winning the re-election.",
          "meta": "Markets are suprised by the abrupt move, and investors are concerned about a possible trade war.",
          "effects": {
            "stocks": -0.05
          },
          "difficulty": 2
        }
      ],
      [
        {
          "title": "Trade tensions rise",
          "description": "New trade policies are put in place by the POTUS. Taxes or tariffs on certain imported goods are largely increased to offset the trade imbalance. The other trading partners respond in retaliation with additional tariffs on US made goods. The back and forth escalation of tarifs is heading towards a full blown tradewar. Discussions are called by the world leaders to work through the trade disagreements.",
          "meta": "Tariffs have resulted in goods, normally imported, becoming expensive at home and inflation is increasing. Consumers and companies can buy less with their dollar and the stock markets drop further.",
          "effects": {
            "stocks": -0.1
          },
          "difficulty": 2
        }
      ],
      [
        {
          "title": "New trade partners",
          "description": "During the current standoff between the US and previous preferred trade partners, other developing countries have taken advantage of the situation. The countries have offered more favorable trade terms to the US and the decision has been made to replace the old trade partners with the new.",
          "meta": "Investors are very enthusiastic about the new trade partners and forcast increased earnings with decreased costs. Stock markets rally.",
          "effects": {
            "stocks": 0.15
          },
          "difficulty": 2,
          "final": true
        },
        {
          "title": "Negotations stall",
          "description": "To avoid a tradewar, the US and it's trade partners are working around the clock to come up with a new agreement that will replace existing trade policies for years to come. As of now, there are still big concessions to be worked through and agreed upon.",
          "meta": "At home, GDP growth continues to slow with a steady rise in unemployment. Stock markets are down slightly with investors waiting to see what the outcome of the trade agreements are. Some investors are buying bonds as insurance",
          "effects": {
            "stocks": -0.02,
            "TB10": 0.03,
            "MB10": 0.03
          },
          "difficulty": 5
        }
      ],
      [
        {
          "title": "Central bank intervention",
          "description": "As the trade negotation continue with no end in sight, the risk of a recession is becoming very real. The Federal Reserve responds by cutting interest rates to 0 as policy markers are urging negoltations and a solution to be found for the new trade policies.",
          "meta": "Stock market continue to sell off regardless of the Quantitative Easing due to fears of a long recession.",
          "effects": {
            "stocks": -0.02,
            "rfrReset": 0
          },
          "difficulty": 4
        },
        {
          "title": "Signed trade agreements",
          "description": "A truce was called between the countries and a new trade agreement was drafted and approved. The tariffs are dropped immediately, and US farmers and other businesses are able to sell surplus to other countries again. ",
          "meta": "GDP growth accelerates for the past few quarters due to more favorable trade. Unemployment remains low. Consumer confidence is at an all time high. Markets soar on the news.",
          "effects": {
            "stocks": 0.1
          },
          "difficulty": 2,
          "final": true
        },
        {
          "title": "Doubling down",
          "description": "The tariffs continue to pile between the US and it's trade partners when all talks break down. The POTUS is convinced that the current drafts of the trade agreements are unacceptable and won't be enough to protect US exports and manufacturing at home.",
          "meta": "Investors are begining to worry that the Fed is running out of ammunition to stave off the Great Depression level of economic fallout. Stock sell off in a panick and investors turn to bonds for safety",
          "effects": {
            "stocks": -0.1,
            "TB10": 0.1,
            "MB10": 0.07
          },
          "difficulty": 5
        }
      ],
      [
        {
          "title": "Signed trade agreements",
          "description": "A truce was called between the countries and a new trade agreement was drafted and approved. The tariffs are dropped immediately, and US farmers and other businesses are able to sell surplus to other countries again. ",
          "meta": "GDP growth accelerates for the past few quarters due to more favorable trade. Unemployment remains low. Consumer confidence is at an all time high. Markets soar on the news and bonds sell off.",
          "effects": {
            "stocks": 0.1,
            "MB10": -0.05,
            "TB10": -0.04
          },
          "difficulty": 5
        }
      ]
    ],
    "Local news": [
      [
        {
          "title": "A new Mayor",
          "description": "The city I live in just elected a new mayor and he's got his work cut out for him. There's a lot of problems to be fixed such as the tax deficit, affordable housing and homelessness.",
          "meta": null,
          "effects": {},
          "difficulty": 2
        },
        {
          "title": "Local sports team moves away",
          "description": "The MLB baseball team that's called the city home has made the decision to move the team to an adjacent city after being offered a brand new stadium.",
          "meta": "It's a big loss to the city since sports events brought in millions in taxes every year.",
          "effects": {},
          "difficulty": 2
        }
      ],
      [
        {
          "title": "Increased business tax",
          "description": "As the first step to address the revenue deficiet, the city passes a new proposition that increases tax on businesses that gross over a certain amount of revenue.",
          "meta": "Many businness leaders object to the new taxes with a few deciding to not renew expiring office leases and opting to move to adjacent cities. Employees moving with the companies list their houses on the market at the same time driving home prices down.",
          "effects": {
            "property": -0.1
          },
          "difficulty": 3,
          "tags": [
            "taxes"
          ]
        },
        {
          "title": "Cut government spending",
          "description": "After review, the Mayor and city officials have concluded that the city's budget has been mismanaged for years. A more conservative budget is put together to cut costs and improve efficiency. Property taxes are increased as well to help make up the difference",
          "meta": "Higher property taxes have dissuaded prospective home buyers causing some weakness in the market.",
          "effects": {
            "property": -0.08
          },
          "difficulty": 3
        },
        {
          "title": "New social programs",
          "description": "The city is investing in cleaning up the streets by introducing social programs targeting illicit drug use and providing the homeless rehab, and job opportuniites to get off the streets.",
          "meta": "The programs start paying off right away and streets are cleaner and neighborhood home values rise.",
          "effects": {
            "property": 0.05
          },
          "difficulty": 3
        },
        {
          "title": "Improved zoning laws",
          "description": "To improve the affordability of housing, the city passes new zoning laws that allow the building of more units and section 8 housing.",
          "meta": "The increased inventory is offset by more people moving to the city for jobs. Housing markets hold steady.",
          "effects": {},
          "difficulty": 3
        }
      ],
      [
        {
          "title": "New business headquarters",
          "description": "The city has secured a bid to be the home of a large corporation's next headquarters by offered large amounts of tax credits. The credits come with stipulations that the company needs to create a certain amount of jobs over the next decade as well as invest a certain amount into public infrastructure.",
          "meta": "Employees begin planning for the move and are working with real estate agents to buy a house. Housing prices rise.",
          "effects": {
            "property": 0.07
          },
          "difficulty": 4,
          "final": true
        },
        {
          "title": "Increased tax revenue",
          "description": "The city is beginning to make up the budget deficit through the additional tax collected. Hiring has slowed down, possibly due to the higher business expenses, and more companies are moving to other cities offering tax credits.",
          "meta": "Housing market is under additional pressure. Prices have dropped enough for many first time home buyers to afford it.",
          "effects": {
            "property": -0.1
          },
          "difficulty": 4,
          "tags": [
            "taxes"
          ]
        }
      ],
      [
        {
          "title": "Investing in public infrastructure",
          "description": "The city has decided to take on public works projects such as the creation of new parks, road repair, and upgrading the sewage system. This work, funded by the additional taxes, help create jobs for a lot of the homeless.",
          "meta": "Streets are much cleaner now and the updates have attracted more people looking to move. Housing prices jump.",
          "effects": {
            "property": 0.1
          },
          "difficulty": 3
        }
      ]
    ]
  }
}
export default Chains;
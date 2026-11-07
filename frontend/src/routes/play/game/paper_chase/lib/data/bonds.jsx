export default [
  {
    "name": "High Yield Corporate Bond (10yr)",
    "ticker": "HYLD", 
    "characteristic": "Risky",
    "description": "These bonds are debt issued by the tech companies and used for growth. These bonds are risky and often the ability for the company to pay back is dependent on the financial health of the company moving forward.",
    "interest": 0.07,
    "yield": 0.07,
    "correlation": -.1,
    "initialPrice": 100,
    "faceValue": 100,
    "years": 10,
    "composition": {
      "GRTH": 1, 
    }
  },
  {
    "name": "US Treasury Bond ETF",
    "ticker": "TB10",
    "characteristic": "Safe",
    "description": "A treasury bond is a form of debt issued out by the US government. The money is backed up by the treasury and thus it is the safest fixed-income investment vehicle available.",
    "interest": 0.01,
    "yield": 0.01,
    "correlation": -.35,
    "initialPrice": 100,
    "faceValue": 100,
    "buyAmount": 100,
    "composition": {
      "VLUE": 1, 
    }
  },
  {
    "name": "Local Municipal Bond (10yr)",
    "ticker": "MB10",
    "characteristic": "Moderate",
    "description": "A local municipal bond is a form of debt issued by the city. There’s more risk in these bonds than a treasury bond; however, the risk is still considerably lower than corporate bonds. The main advantage of municipal bonds is that no state tax is collected on the cash or gains.",
    "interest": 0.03,
    "yield": 0.03,
    "correlation": -.25,
    "initialPrice": 100,
    "faceValue": 100,
    "years": 10,
    "composition": {
      "GRTH": .5,
      "VLUE": .5,  
    }
  },
]
import properties from "../data/properties";

export function HousesHistory(state, actions) {
  const houses = actions.reduce((houses, action) => {
    if (action.type === 'buyHouse') {
      return houses.concat([action])
    } else if (action.type === 'getHouse') {
      return houses.concat([action])
    } else if (action.type === 'sellHouse') {
      return houses.map((house) => {
        if (house.id === action.id) {
          if (house.year === action.year) {
            return null;
          } else {
            return {...house, sold: action}
          }
        } else {
          return house;
        }
      }).filter(Boolean)
    } else {
      return houses
    }
  }, []);

  var residence = Residence({
    ...state,
    houses
  }, actions);
  
  return houses.map((house) => {
    const choice = properties.find((p) => p.name == house.name);
    const price = computePropertyPrice(choice, state, actions, house.id)
    const kind = house.kind || choice.kind || 'residential';
    const isResidence = residence && residence.id == house.id;
    const isRentedOut = kind === 'residential' ? !isResidence : actions.find((a) => a.type == 'rentOut' && a.id == house.id)

    return {
      ...house,
      ...choice,
      kind: kind,
      initialPrice: choice.price,
      price: price,
      loan: state.loanHistory.find((a) => a.id === house.id),
      isRentedOut: isRentedOut,
      isResidence: isResidence,
      rentPrice: price * choice.rentRate,
      tax: price * choice.taxRate,
    }
  })
}

export function computePropertyPrice({price, appreciationRate, isAppreciated}, state, actions, houseId) {
  
  
  var appreciatedPrice = price;


  for (var year = state; year.turn > -1; year = year.previous) {
    if (isAppreciated) {
      // apply constant appreciation rate
      appreciatedPrice *= (1 + appreciationRate)
      
      // apply property value modifiers coming from news
      appreciatedPrice = year.events.reduce((appreciatedPrice, event) => {
        return appreciatedPrice * (1 + (event.effects.property || 0));
      }, appreciatedPrice);
    }

    // add renovated money
    appreciatedPrice = actions.reduce((appreciatedPrice, action) => {
      if (action.type === 'renovate' && action.year == year.year && action.id === houseId) {
        return appreciatedPrice + action.amount
      }
      return appreciatedPrice;
    }, appreciatedPrice);
  }
  
  return appreciatedPrice
}

export function Houses({housesHistory}) {
  return housesHistory.filter((house) => !house.sold);
}

export function Residence(state, actions) {
  return actions.reduce((residence, action) => {
    if (action.type === 'moveIn') {
      return state.houses.find((house) => house.id === action.id) 
    } else if (action.type === 'moveOut') {
      return null;
    } else {
      return residence;
    }
  }, null)
}

export function RentIncome({houses, residence}) {
  return houses.reduce((acc, house) => {
    return acc + (house.isRentedOut ? house.rentPrice : 0)
  }, 0)
}

export function Rent(state, actions) {
  if (state.age < 19) return null;
  return actions.reduce((rent, action) => {
    if (action.type === 'moveIn') {
      return null;
    } else if (action.type === 'moveOut') {
      return action;
    } else {
      return rent;
    }
  }, !state.study ? {
    type: 'moveOut', 
    expenses: 24000, 
  } : null)
}
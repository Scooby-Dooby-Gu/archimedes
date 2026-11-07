import { Decision, Icon } from '../components'
import * as formatters from '/lib/formatters';
import { Grid, Button } from '/components/index.jsx';
import style from './style.module.scss';
import choices from '../lib/data/choices';




export default function PaperChaseProperty({ input, data: { session: { actions, log } }, decisions, state, params: { itemId, tooltip }}) {

  const {
    residence,
    houses,
    rent,
  } = state;
  const applicableDecisions = decisions.presented.filter((decision) => 
    decision.choice.type === 'property' && decision.choice.name !== 'house');

    /*
  const transition = useTransition(renderedOptions.concat(actions || []), {
    from:  { opacity: 0, transform: `translate3d(30%,-30%,0)`, marginBottom: '0px', maxHeight: '0px'},
    enter: (item) => ({ opacity: 1, transform: 'translate3d(0%,0%,0)', marginBottom: String(item.props.index).includes('event') ? '5px' : '20px', maxHeight: '300px'}),
    leave: { opacity: 0, transform: 'translate3d(0%,-30%,0)', marginBottom: '0px', maxHeight: '0px'},
    trail: value != null ? 1 : 100,
    key: (page) => page && page.props.index,
  }) */
 
  
  return <div class="centered">
    <p class={`${style.intro} intro`}>Manage, buy and sell your investment properties. Properties can appreciate value over time and generate passive income by renting them out.</p>
    {rent && <section class={style.section}>
      <h2>Rental</h2>
      <ul class={`${style.list} ${style.rental}`}>
        <li>
          <a>
            <aside>-{formatters.currency(rent.expenses)}/yr</aside>
            <div class={style.summary}>
              <h3>Apartment</h3>
            </div>
          </a>
        </li>
      </ul>
    </section>}

    {houses.length > 0 && <section class={style.section}>
      <h2>Properties owned</h2>
      <ul class={style.list}>
        {houses.map((house, index) => {
          const open = itemId && itemId == index;
          const isRennovatable = house.kind === 'holiday' && house.price >= 60000 ? false : true;
          const rennovationIncrement = house.kind === 'holiday' ? 60000 - house.price : 10000;
          return <li id={"property-" + house.kind}>
            <a href={`/games/paper-chase/property/${open ? '' : index}?tooltip=${tooltip}`}>
              <aside>
                <div>
                  {`${formatters.currency(house.price)}`}
                  <small>
                    {house.isRentedOut && `+${formatters.currency(house.rentPrice - house.tax)}/yr`}
                    {!house.isRentedOut && house.expenses > 0 && `-${formatters.currency(house.expenses)}/yr`}
                  </small>
                </div>
                {open && <Icon.Up />}
                {!open && <Icon.Down />}
              </aside>

              {house.image && <div class={style.image}>
                <Icon name={house.image} />
              </div>}
              <div class={style.summary}>
                <h3>{house.name}</h3>
                <p class={style.status}>
                  {house.kind === 'residential' && (house.isResidence ? 'Current residence' : 'Rented out')}
                  {house.kind === 'holiday' && (house.isRentedOut ? 'Rented out' : (isRennovatable ? <strong>Needs rennovation</strong> : 'Vacant'))}
                </p>
                {house.loan && [
                  <progress max={house.loan.total} value={house.loan.paidTotal} />,
                  /*selected && */[
                    <small class="small">
                      {formatters.currency(house.loan.yearlyPayment)}/yr for {house.loan.years} years
                    </small>
                  ]
                ]}
              </div>
            </a>
            {<div class={style.details} hidden={!open}>
              <p>{house.description}</p>
              <div class={style.actions}>
                {<Button disabled={state.cash < rennovationIncrement || !isRennovatable} class={`secondary shadow ${isRennovatable && 'primary'}`} onClick={() => input.onAction({type: 'renovate', id: house.id, amount: rennovationIncrement, context: house.name})}>{isRennovatable ? ['Renovate', <strong class={style.badge}>-{formatters.currency(rennovationIncrement)}</strong>] : 'Fully renovated'}</Button>}
                {house.kind === 'residential' && !house.isResidence && <Button class="secondary shadow" onClick={() => input.onAction({type: 'moveIn', id: house.id, context: house.name, from: state.residence})}>Move in</Button>}
                {house.kind === 'residential' && house.isResidence && <Button class="secondary shadow" onClick={() => input.onAction({type: 'moveOut', id: house.id})}>Rent out</Button>}
                {house.kind === 'holiday' && <Button alt="Rent out" class={`secondary shadow ${isRennovatable ? '' : 'primary'}`} onClick={() => input.onAction({type: 'rentOut', id: house.id, context: house.name, amount: 9000})} disabled={house.isRentedOut || isRennovatable}>{house.isRentedOut ? 'Rented out' : 'Rent out'}</Button>}
                {house.type !== 'getHouse' && <Button class="secondary primary" onClick={() => input.onAction({type: 'sellHouse', id: house.id, name: house.name, amount: house.price})}>Sell</Button>}
              </div>
            </div>}
          </li>
        })}
      </ul>
    </section>}

    <section class={style.market}>
      <Icon.IllustrationsHouses color={false} />
      <h2>Buying property</h2>
      <p>Real estate can be a good investment. You can stop paying rent and move into a home or you could earn income by renting out that property to others. You work with a real estate agent to see what is currently on the market.</p>
      <Button onClick={(e) => input.onDialog('property-buy', null, e)} class="primary">See what's on market</Button>
    </section>
    
    {applicableDecisions.map((decision) => 
      <Decision {...decision} onDialog={input.onDialog} state={state} optional={decision.choice.year !== state.year} />)}
  </div>
}

import { useMemo, useDebouncedMemo, useEffect, useState, useRef } from '/lib/hooks/index.jsx';

import update from '/lib/immutability';

import { getSkills } from '/lib/data';

export default function PaperChaseUI(environment, { closedTooltips }) {
  const { world: { state }, params, decisions, data, progression, ui } = environment;
  
  useEffect(() => {
    const checkUpdate = function() {
      if (!document.hidden) data.sessionReload();
    }
    document.addEventListener("visibilitychange", checkUpdate);
    return () => {
      document.removeEventListener("visibilitychange", checkUpdate);
    }
  }, [])

  useEffect(() => {
    const menuElement = document.querySelector('#game-menu');
    setTimeout(() => {
      if (!params.tooltip) {
        if (menuElement && menuElement.closest('[scrollable]').scrollTop > 20) menuElement.scrollIntoViewCustom({
          behavior: 'smooth',
          block: 'end',
        })
      }
    }, 10)
  }, [params.section/*, params.itemId */, params.dialog.open, params.tooltip])

  useEffect(() => {
    if (params.dialog.open) {
      if (params.dialog.name !== 'start') {
        document.querySelector('#app').classList.add('footerHidden');
      }
    } else {
      document.querySelector('#app').classList.remove('footerHidden');
    }
    return () => {
      document.querySelector('#app').classList.remove('footerHidden');
    }
  }, [params.dialog.open, params.dialog.name])

  useEffect(() => {
    const gameElement = document.querySelector('[route="game"]');
    if (gameElement) {
      const onClick = (e) => {
        var link = e.target.closest('a[href]');
        if (link && link.href.match(/\lessons/)) {
          var href = link.href;
          link.href = link.pathname + '?from=' + encodeURIComponent(location.pathname);
          setTimeout(() => {
            link.href = href;
          }, 100)
        }
      };

      gameElement.addEventListener("click", onClick, true);
      return () => {
        gameElement.removeEventListener("click", onClick);
      }
    }
  }, [])
  var tooltip = useDebouncedMemo(() => {
    const entireLog = data.session.log.concat(data.session.actions)
    const skills = getSkills(data.submissions, data.courses);
    const economist = skills.find((skill) => skill.name === 'Economist');
    if (params.dialog.open && !params.tooltip) return;
    
    const firstDividends = (({dividends, sector, previous}) => {
      if (dividends /*&& sector*/) {
        // check if itsn't not the first year with dividends
        for (var p = previous; p; p = p.previous) {
          if (p.dividends/* && p.sector */) {
            return false;
          }
        }
        return true;
      }
    })(state);

    const firstJob = entireLog.find((a) => a.type === 'work' && a.kind !== 'minimum');

    var highestDividends = (({sector, companies}) => {
      const stocks = companies.filter((company) => sector && sector.industries.includes(company.industry))
      return stocks.sort((a, b) => b.dividends - a.dividends)[0]
    })(state);

    // dividends lesson
    if (!closedTooltips.includes('next-step') && !decisions.outstanding.length && !progression.active && state.turn === -1) {
      return {
        id: 'next-step',
        selector: '#next-step > div',
        text: `Once you've made your decisions, tap here to finish the current year and advance the story to the next year.`,
        x: 'center',
        y: 'top'
      }
    } else if (!closedTooltips.includes('dividends') && params.tooltip === 'dividends' && highestDividends && params.dialog.name === 'stock' && params.dialog.page == highestDividends.name) {
      return {
        id: 'dividends',
        selector: '#stock-yield',
        text: 'Certain stocks pay out higher dividends than others.',
        x: 'center',
        appearanceDelay: 600,
        actionable: false,
      }
    } else if (!closedTooltips.includes('stock-dividends') && params.tooltip === 'dividends' && highestDividends) {
      return {
        id: 'stock-dividends',
        offsetY: -27,
        selector: '#stock-' + highestDividends.ticker,
        text: 'Dividend yields, displayed in percentages, can be seen for each stock and mutual fund. Higher yields result in higher dividend returns.',
        x: 'center',
        appearanceDelay: 600,
        scrollDelay: 200,
      }

    // beta investments lesson
    } else if (!closedTooltips.includes('risky-stock') && params.tooltip === 'beta' && params.section === 'investments' && state.choices.investmentSectors[0] && !params.dialog.open) {
      const stocks = state.companies.filter((company) => state.choices.investmentSectors[0].industries.includes(company.industry)).sort((a, b) => {
        return b.beta - a.beta;
      });
      const bestStock = stocks[0].ticker;
      return {
        id: 'risky-stock',
        offsetY: -27,
        selector: '#stock-' + bestStock,
        text: 'This is a riskier stock.',
        x: 'center',
        appearanceDelay: 600,
        scrollDelay: 200,
      }
    } else if (!closedTooltips.includes('stock-beta') && params.tooltip === 'beta' && params.section === 'investments' && state.choices.investmentSectors[0] && params.dialog.name == 'stock') {
      return {
        id: 'stock-beta',
        selector: '#stock-beta',
        text: 'A higher beta value means more risk.',
        x: 'center',
        appearanceDelay: 600,
        scrollDelay: 200,
        actionable: false
      }

    // alpha investments lesson
    } else if (!closedTooltips.includes('stock-performance') && params.tooltip === 'alpha' && params.section === 'investments' && state.choices.investmentSectors[0] && !params.dialog.open) {
      const stocks = state.companies.filter((company) => state.choices.investmentSectors[0].industries.includes(company.industry)).sort((a, b) => {
        return b.alpha - a.alpha;
      });
      const bestStock = stocks[0].ticker;
      return {
        id: 'stock-performance',
        offsetY: -27,
        selector: '#stock-' + bestStock,
        text: 'This stock has performed well over the years.',
        x: 'center',
        appearanceDelay: 600,
        scrollDelay: 200,
      }
    } else if (!closedTooltips.includes('stock-alpha') && params.tooltip === 'alpha' && params.section === 'investments' && state.choices.investmentSectors[0] && params.dialog.name == 'stock') {
      return {
        id: 'stock-alpha',
        selector: '#stock-alpha',
        text: 'A higher alpha means better performance compared to the market.',
        x: 'center',
        appearanceDelay: 600,
        scrollDelay: 200,
        actionable: false
      }

    } else if (!closedTooltips.includes('portfolio') && params.tooltip === 'portfolio' && params.section === 'investments' && !params.dialog.open) {
      return {
        id: 'portfolio',
        selector: '#brokerage-portfolio',
        text: 'Performance metrics of your portfolio are found here.',
        x: 'left',
        appearanceDelay: 600,
        scrollDelay: 200,
        actionable: false
      }

    } else if (!closedTooltips.includes('stock-5050') && params.tooltip === 'investments/5050' && params.section === 'investments') {
      return {
        id: 'stock-5050',
        selector: '#stock-5050',
        offsetY: -27,
        text: 'Grandma suggested that I take a look at the 50/50 mutual fund since it provides a lot of protection in the form of bonds for market downturns.',
        x: 'center',
        appearanceDelay: 600,
        scrollDelay: 200,
        actionable: false
      }
    } else if (!closedTooltips.includes('stock-9010') && params.tooltip === 'investments/9010' && params.section === 'investments') {
      return {
        id: 'stock-9010',
        selector: '#stock-9010',
        offsetY: -27,
        text: 'Grandma suggested the 90/10 mutual fund for an aggressive allocation. It’s got a little bit of protection with 10% bonds bringing it a bit safer than the very risky growth mutual fund.',
        x: 'center',
        appearanceDelay: 600,
        scrollDelay: 200,
        actionable: false
      }
    // passive investments lesson
    } if (!closedTooltips.includes('bonds-buy') && params.tooltip === 'yields' && params.dialog.name === 'stock' && params.dialog.page == 'Treasury Bonds 10 yr') {
      return {
        id: 'bonds-buy',
        selector: '[name="personal"]',
        text: 'Enter the number of bonds to be purchased. Try 10 to start.',
        x: 'center',
        appearanceDelay: 600,
      }
    /*} else if (state.choices.joinedInvestmentClub && state.choices.joinedInvestmentClub.year == state.year && params.section === 'story' && params.itemId !== 'news') {
      return {
        selector: '[class*="tabs"] li:nth-child(2)',
        text: 'Read the news here',
        x: 'center',
        appearanceDelay: 1000,
        actionable: false
      } */
    } else if (!closedTooltips.includes('stock-tb10') && params.tooltip === 'yields' && !params.dialog.open) {
      return {
        id: 'stock-tb10',
        offsetY: -27,
        selector: '#stock-TB10',
        text: 'A conservative investment like a Treasury bond is a safe choice when we need to earn a positive return.',
        x: 'center',
        appearanceDelay: 600,
        scrollDelay: 200,
      }
    } else if (!closedTooltips.includes('loan') && params.tooltip === 'loan' && params.section == 'finance') {
      return {
        id: 'loan',
        selector: '[id*="loan-"]',
        text: 'Click here to see the prepay and refinance options for your loan.',
        x: 'center',
        scrollPosition: 'start',
        scrollDelay: 400,
        appearanceDelay: 700,
      }
    } else if (!closedTooltips.includes('property-challenge') && params.tooltip === 'property-challenge' && params.section == 'property') {
      return {
        id: 'property-challenge',
        selector: '[id*="property-holiday"]',
        text: 'Improve your equity value in a house by renovating. A renovated house can be sold or rented out for more.',
        x: 'center',
        scrollPosition: 'start',
        scrollDelay: 400,
        appearanceDelay: 700,
      }
    } else if (!closedTooltips.includes('property-challenge-rent') && params.tooltip === 'property-challenge' && params.section == 'property') {
      return {
        id: 'property-challenge-rent',
        context: '[id*="property-holiday"]',
        selector: '[id*="property-holiday"] [alt="Rent out"]:not([disabled])',
        text: 'Collect passive income from your property by renting them out',
        x: 'right',
        scrollPosition: 'start',
        scrollDelay: 400,
        appearanceDelay: 700,
      }
    } else if (!closedTooltips.includes('investment-club') && state.choices.joinedInvestmentClub && state.choices.joinedInvestmentClub.year == state.year && params.section === 'economy') {
      if (entireLog.find((a) => a.type == 'lesson' && a.lessonId === 138)) {
        return {
          id: 'investment-club',
          context: '[categoryIndex]',
          selector: '[categoryIndex="0"] [year="' + state.year + '"] h3',
          text: 'Keep track of global news and black swan events that can quickly change the markets.',
          x: 'left',
          y: 'top',
          offsetY: -27,
          appearanceDelay: 300,
          scrollDelay: 750,
          actionable: false,
          clickedContext: true
        }
      } else if (entireLog.find((a) => a.type == 'lesson' && a.lessonId === 140)) {
        return {
          id: 'investment-club',
          context: '[categoryIndex]',
          selector: '[categoryIndex="1"] [year="' + state.year + '"] h3',
          text: 'Learn about economic developments at home and predict how the markets will react.',
          x: 'left',
          y: 'top',
          offsetY: -27,
          appearanceDelay: 468,
          scrollDelay: 750,
          actionable: false,
          clickedContext: true
        }
      } else {
        return {
          id: 'investment-club',
          context: '[categoryIndex]',
          selector: '[categoryIndex="2"] [year="' + state.year + '"] h3',
          text: 'Read about yearly changes in politics and legislative risks to your investments.',
          x: 'left',
          y: 'top',
          offsetY: -27,
          appearanceDelay: 468,
          scrollDelay: 750,
          actionable: false,
          clickedContext: true
        }
      }
    } else if (!closedTooltips.includes('news-tab') && !decisions.outstanding.length && state.choices.joinedInvestmentClub && !progression.active && state.choices.joinedInvestmentClub.year == state.year  && state.choices.joinedInvestmentClub.year == state.year && params.section !== 'economy') {
      return {
        id: 'news-tab',
        selector: '#news-tab',
        scrollPosition: 'end',
        text: 'Tap here to follow the news.',
        x: 'left',
        y: 'top'
      }
    } else if (!closedTooltips.includes('previous-year') && state.choices.joinedInvestmentClub && state.choices.joinedInvestmentClub.year == state.year && params.section === 'economy') {
      return {
        id: 'previous-year',
        context: '[categoryIndex]',
        selector: '[categoryIndex] [class*="back"] a',
        text: 'Review the events in previous years',
        x: 'left',
        scrollDelay: 200,
        appearanceDelay: 568,
        actionable: false
      }
      
    } else if (!closedTooltips.includes('skipped-college') && !decisions.outstanding.length && !progression.active && state.turn === 0 && !state.study) {
      return {
        id: 'skipped-college',
        selector: '#career-tab',
        text: 'Tap the Career tab here if you change your mind and want to enroll in school.',
        x: 'center',
        y: 'top',
        scrollPosition: 'end',
        actionable: false
      }
    // just after grandma challenge is chosen
    } else if (!closedTooltips.includes('investments-tab') && !decisions.outstanding.length && !progression.active && state.turn === 1 && data.session.actions.length > 0) {
      return {
        id: 'investments-tab',
        selector: '#investments-tab',
        scrollPosition: 'end',
        text: 'Tap here to manage your investments.',
        x: 'left',
        y: 'top'
      }
    } else if (!closedTooltips.includes('free-report') && params.section === 'economy' && entireLog.find((a) => a.type === 'freeReport') && !entireLog.find((a) => a.type === 'buyReport')) {
      return {
        id: 'free-report',
        context: 'ul[class*="steps"]',
        selector: '#free-report',
        scrollDelay: 800,
        scrollPosition: 'end',
        offsetY: 150,
        appearanceDelay: 468,
        text: 'Increase your literacy around current events. This one is your selected promotional offer.',
        x: 'right'
      }
    } else if (!closedTooltips.includes('economist-research') && progression.active && params.section === 'economy' && entireLog.find((a) => a.type === 'challenge' && a.kind === 'economist') && entireLog.find((a) => a.type === 'challenge' && a.kind === 'economist').year === state.year - 1 && (!economist || economist.level === 1)/* && economist.passed === 0*/ ) {
      return {
        id: 'economist-research',
        context: '[class*="wrapper"]',
        selector: '#next-economist-lesson',
        scrollDelay: 800,
        appearanceDelay: 468,
        text: 'To start my research for Mary, select the Next lesson button.',
        x: 'right',
        actionable: false
      }
    } else if (!closedTooltips.includes('news-indicator') && !closedTooltips.includes('investments-tab-more') && !decisions.outstanding.length && !progression.active && params.section !== 'investments' && state.turn == 10) {
      return {
        id: 'investments-tab-more',
        selector: '#investments-tab',
        appearanceDelay: 300,
        text: 'Tap here to see the new features unlocked for your investments.',
        x: 'center',
        y: 'top',
      }
    } else if (!closedTooltips.includes('news-indicator') && !decisions.outstanding.length && !progression.active && params.section === 'investments' && state.turn == 10) {
      return {
        id: 'news-indicator',
        context: '[class*="ticker"]',
        selector: '.news-indicator',
        scrollDelay: 900,
        offsetY: -27,
        clickedContext: true,
        appearanceDelay: 468,
        text: 'This alert indicates that there’s specific news this year affecting the company’s stock price.',
        x: 'right'
      }
    } else if (!closedTooltips.includes('property-tab') && !decisions.outstanding.length && !progression.active && state.turn == 12) {
      return {
        id: 'property-tab',
        selector: '#property-tab',
        scrollPosition: 'end',
        text: 'Tap here to manage your real estate portfolio. Buy, rent and sell your properties.',
        x: 'left',
        y: 'top'
      }
    } else if (!closedTooltips.includes('finance-tab') && !decisions.outstanding.length && !progression.active && firstDividends && params.section !== 'finance' && !params.dialog.open) {
      return {
        id: 'finance-tab',
        selector: '#finance-tab',
        scrollPosition: 'end',
        text: 'You’ve collected your first dividend income. Tap here to see and manage your personal finances including loans and taxes.',
        x: 'right',
        y: 'top'
      }
    } else if (!closedTooltips.includes('cash-flow') && !decisions.outstanding.length && !progression.active && firstDividends && params.section === 'finance') {
      return {
        id: 'cash-flow',
        selector: '#cash-flow-breakdown',
        appearanceDelay: 700,
        text: 'Tap here to see your income, expenses, and taxes for the year.',
        x: 'right',
        //y: 'top'
      }
    } else if (!closedTooltips.includes('career-tab') && !decisions.outstanding.length && !progression.active && firstJob && firstJob.year == state.year) {
      return {
        id: 'career-tab',
        selector: '#career-tab',
        scrollPosition: 'end',
        text: 'Congrats on your first job. Tap here to see and manage your career details including salary history and 401(k) elections.',
        x: 'right',
        y: 'top'
      }
    } else if (!closedTooltips.includes('new-loan') && params.tooltip == 'new-loan' && params.section === 'finance' && !params.dialog.open) {
      return {
        id: 'new-loan',
        selector: '[name="loan"]',
        appearanceDelay: 468,
        scrollDelay: 500,
        text: 'Click here to browse loan sizes and terms available.',
        x: 'center'
      }
    } else if (!closedTooltips.includes('rsus') && !closedTooltips.includes('investments-rsus') && !decisions.outstanding.length && !progression.active && firstJob && firstJob.kind === 'corporate' && firstJob.year + 1 == state.year && params.section !== 'investments') {
      return {
        id: 'investments-rsus',
        selector: '#investments-tab',
        appearanceDelay: 500,
        text: 'You have a significant increase in your investment holdings.',
        x: 'left'
      }
    } else if (!closedTooltips.includes('rsus') && !decisions.outstanding.length && !progression.active && firstJob && firstJob.kind === 'corporate' && firstJob.year + 1 == state.year && params.section === 'investments') {
      return {
        id: 'rsus',
        selector: '.has-rsus',
        appearanceDelay: 600,
        actionable: false,
        scrollDelay: 200,
        offsetY: -27,
        text: 'The RSU or Restricted Stock Units offered by your company will accrue every year and can be sold.',
        x: 'center'
      }
    } else if (!closedTooltips.includes('evidence') && params.section === 'results' && state.evidence.length && !state.previous.evidence.length) {
      return {
        id: 'evidence',
        selector: '#evidence',
        appearanceDelay: 600,
        actionable: false,
        scrollDelay: 200,
        offsetY: -27,
        text: `Your companion liked you enough to give you evidence to use against Mr. Sinister in court.`,
        x: 'center',
        y: 'top'
      }
    }
  }, [closedTooltips, decisions.outstanding.length, state.age, state.evidence, !!state.job, params.dialog.open, params.dialog.page, params.section, data.session.actions, data.session.log, data.submissions])

  const uiRef = useRef()

  useEffect(() => {
    if (params.dialog.open) {
      uiRef.wasOpen = params.dialog.name;
    } else if (uiRef.wasOpen) {
      const action = data.session.actions.find((action) => action.redirect);
      if (!params.dialog.open && action && action.redirect) {
        route(action.redirect);
      }
    }
  }, [params.dialog.open]);


  
  return {
    tooltip
  }
}
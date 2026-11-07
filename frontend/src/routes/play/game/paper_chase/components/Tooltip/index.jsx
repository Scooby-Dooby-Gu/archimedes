import style from './style.module.scss';
import { useState, useRef, useEffect, useCallback } from '/lib/hooks/index.jsx';

export default function Tooltip({tooltip, ui, data, input, world: { state }}) {
  const wrapperRef = useRef();
  const messageRef = useRef();
  const coverRef = useRef();
  
  const closeRef = useRef();
  useEffect(() => {
    var interval, timeout;
    const gameElement = document.querySelector('[route="game"]');
    if (!tooltip || !gameElement || !wrapperRef.current) return;
    
    var clickableElement;

    
    const onTouchMove = (e) => {
      if (wrapperRef.showing || (clickableElement && !clickableElement.contains(e.target))) {
        e.preventDefault();
        e.stopPropagation()
      }
    };
    const onTouch = (e) => {
      if (wrapperRef.showing || 
        (tooltip.actionable !== false && (
        (!clickableElement || !clickableElement.contains(e.target)) 
        && !closeRef.current.contains(e.target))
      )) {
        e.preventDefault();
        e.stopPropagation()
      } else {
        input.onTooltipClose(tooltip.id)
      }
    }

    // step 1: Wait 100 seconds for element to appear
    const show = () => {
      const targetElement = tooltip && document.querySelector(tooltip.selector);
      if (targetElement)  {
        clearInterval(interval);
        clearTimeout(timeout);

        const reposition = () => {
          const context = tooltip.context ? targetElement.closest(tooltip.context) : targetElement;
          if (!context) return;
          const rootBox = wrapperRef.current.getBoundingClientRect(); 
          const contextBox = context.getBoundingClientRect();
          const targetBox = targetElement.getBoundingClientRect();
          const box = {
            left: targetBox.left - rootBox.left,
            top: targetBox.top - rootBox.top,
            width: targetBox.width,
            height: targetBox.height,
          }
          const parentBox = {
            left: contextBox.left - rootBox.left,
            top: contextBox.top - rootBox.top,
            width: contextBox.width,
            height: contextBox.height,
          }
          coverRef.current.style.borderRadius = window.getComputedStyle(context).borderRadius;
          coverRef.current.style.top = parentBox.top + 'px';
          coverRef.current.style.left = parentBox.left + 'px';
          coverRef.current.style.width = parentBox.width + 'px';
          coverRef.current.style.height = parentBox.height + 'px';
          if (tooltip.x === 'right') {
            messageRef.current.style.left = box.left + box.width + 'px';
          } else if (tooltip.x === 'left') {
            messageRef.current.style.left = box.left + 'px';
          } else  {
            messageRef.current.style.left = box.left + box.width / 2 + 'px';
          }
          closeRef.current.style.top = box.top + box.height + 'px';
          messageRef.current.style.top = tooltip.y != 'top' ? box.top + box.height + 'px' : box.top + 'px';
        }

        const context = tooltip.context ? targetElement.closest(tooltip.context) : targetElement;
        if (!context) throw new Error('Context is missing' + toltip.context)
        clickableElement = tooltip.clickedContext ? context : targetElement;
        
        wrapperRef.showing = true;

        document.body.addEventListener('click', onTouch, true);
        document.body.addEventListener('touchmove', onTouchMove, { passive: false });
    
        
        // step 2: Delay before scrolling 
        timeout = setTimeout(() => {
          if (tooltip.scrollPosition !== false)
           context.scrollIntoViewCustom({behavior: data.animations === false ? undefined : 'smooth', block: tooltip.scrollPosition || 'center', offsetTop: tooltip.offsetY})
          
          // step 3: Show the tooltip itself
          timeout = setTimeout(() => {
            messageRef.current.className = `${style.message} ${style[tooltip.x]} ${style[tooltip.y]}`;
            messageRef.current.textContent = tooltip.text;
            wrapperRef.current.removeAttribute('hidden');
            wrapperRef.current.classList.remove(style.none)
            // step 4: Allow clicking now
            timeout = setTimeout(() => {
              wrapperRef.showing = false;
            }, 300)
            reposition()
            interval = setInterval(reposition, 500)
          }, tooltip.appearanceDelay || 0)
          setTimeout(reposition, 10);
        }, tooltip.scrollDelay || 0)
        clickableElement.classList.add(style.unblockedPointerEvents)
      }
    }
    
    interval = setInterval(show, 300);
    timeout = setTimeout(show, 100);


    return () => {
      document.body.removeEventListener('click', onTouch, true);
      document.body.removeEventListener('touchmove', onTouchMove, { passive: false });
      if (clickableElement)
        clickableElement.classList.remove(style.unblockedPointerEvents)
      gameElement.classList.remove(style.blockedPointerEvents)
      wrapperRef.current.setAttribute('hidden', 'hidden');
      clearTimeout(timeout);
      clearInterval(interval);
      timeout = setTimeout(() => {
        if (!wrapperRef.showing && wrapperRef.current) wrapperRef.current.classList.add(style.none)
      }, 300)
      wrapperRef.showing = false;
    }
  }, [tooltip]);

  return <div ref={wrapperRef} class={style.wrapper} hidden>
    <div ref={messageRef} class={style.message}></div>
    <div ref={coverRef} class={style.cover}></div>
    <a alt="Dismiss" ref={closeRef} class={style.close}></a>
  </div>
}
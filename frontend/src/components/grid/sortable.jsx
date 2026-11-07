import { useEffect } from "/lib/hooks";

function getItems(el) {
  return Array.prototype.filter.call(el.children, (item) => item.tagName === 'LI' && !item.classList.contains('splitter'));
}

export default function useSorting(elementRef, onSort) {
  const getHref = (el) => el.closest('[draggable]').querySelector('.handle').getAttribute('href')
  useEffect(() => {
    if (!onSort) return;
    var oldIndex;
    const onDrop = (e) => {
      const href = e.dataTransfer.getData("text/plain")
      const el = e.target.closest('[draggable]');
      if (el) {
        const items = getItems(el.parentNode);
        var index = items.indexOf(el) + 1;
        if (oldIndex == index - 1) {
          onSort(getHref(el), index - 1);
        } else {
          onSort(href, index);
        }
      }
    }

    const onDragOver = (e) => {
      e.preventDefault();
    }

    const onDragStart = (e) => {
      if (!e.target.closest('.handle')) {
        //e.preventDefault();
      }
      const el = e.target.closest('[draggable]');
      const items = getItems(el.parentNode);
      oldIndex = items.indexOf(el) + 1;
      e.dataTransfer.setData("text/plain", getHref(e.target));
    }

    const ref = elementRef.current;
    ref.addEventListener('dragstart', onDragStart);
    ref.addEventListener('dragover', onDragOver);
    ref.addEventListener('drop', onDrop);
    const children = getItems(ref);
    for (var i = 0; i < children.length; i++) {
      children[i].setAttribute('draggable', true);
    }
    return () => {
      ref.removeEventListener('dragstart', onDragStart);
      ref.removeEventListener('dragover', onDragOver);
      ref.removeEventListener('drop', onDrop);
      for (var i = 0; i < children.length; i++) {
        children[i].removeAttribute('draggable');
      }
    }

  }, [onSort])
}
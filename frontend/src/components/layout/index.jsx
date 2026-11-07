import Mobile from './mobile';
import Desktop from './desktop';

import { useStore } from '/lib/hooks/index.jsx';

export default function({children, ...props}) {
  const maxWidth = useStore('app.maxWidth');

  const Breakpoint = maxWidth > 784 ? Desktop : Mobile;

  return <Breakpoint>{children}</Breakpoint>
}
import { useMemo } from "preact/hooks";
import { Icon, Page } from '/components/index.jsx';

export default function Goals() {
  const navigation = useMemo(() => ({
    actionTitle: <Icon.Add />,
    actionLink: '/goals/new'
  }), []);
  return <Page id="goals" navigation={navigation}>
    123
  </Page>
}
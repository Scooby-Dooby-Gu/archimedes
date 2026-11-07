import { Grid } from "../../../components";
import { useStore } from "../../../lib/state";
export default function Header() {
  const route = useStore('location.route')
  return <Grid 
    type="tabs" 
    class={`main`}
    headers={[
      {name: 'Link', type: 'link'},
      {name: 'Name'}
    ]} 
    rows={[[
      "/admin/users",
      "Users",
      {class: route == 'users' && 'selected'},
    ], [
      "/admin/logs",
      "Logs",
      {class: route == 'logs' && 'selected'},
    ], [
      "/admin/trends",
      "Trends",
      {class: route == 'trends' && 'selected'},
    ], [
      "/companies",
      "Companies",
      {class: route == 'companies' && 'selected'},
    ]]} />;
    
}
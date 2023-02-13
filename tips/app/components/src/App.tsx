// React
import { useEffect } from 'react';

// StreamLit
import { Streamlit, withStreamlitConnection, ComponentProps } from 'streamlit-component-lib';

// Components
import ProcessTable from '@/components/ProcessTable';

// Interfaces
import { ProcessDataInterface } from '@/Interfaces';

interface PropsInterface_ProcessTable {
  component: 'ProcessTable';
  processData: ProcessDataInterface;
}

interface ComponentPropsWithArgs extends ComponentProps {
  args: PropsInterface_ProcessTable;
}

function App(props: ComponentPropsWithArgs) {
  const { component } = props.args;
  useEffect(() => { Streamlit.setFrameHeight() }); // Update frame height on each re-render

  switch(component) {
    case 'ProcessTable': {
      const { processData } = props.args;
      return <ProcessTable processData={processData} />;
    }

    default:
      return <p>Invalid component name</p>;
  }
}

export default withStreamlitConnection(App)
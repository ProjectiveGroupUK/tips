// StreamLit
import { withStreamlitConnection, ComponentProps } from 'streamlit-component-lib';

// Contexts
import ProcessDataContextProvider from '@/components/ProcessTable/contexts/ProcessDataContext';

// Components
import ProcessTable from '@/components/ProcessTable/jsx/ProcessTable';
import EditCommandModal from '@/components/ProcessTable/jsx/EditCommandModal';

// Interfaces
import { ProcessDataInterface } from '@/interfaces/Interfaces';

// CSS
import '../node_modules/react-tooltip/dist/react-tooltip.css' // CSS for default styling of react-tooltip components

interface PropsInterface_ProcessTable {
  component: 'ProcessTable';
  processData: ProcessDataInterface;
}

interface ComponentPropsWithArgs extends ComponentProps {
  args: PropsInterface_ProcessTable;
}

function App(props: ComponentPropsWithArgs) {
  const { component } = props.args;

  switch(component) {
    case 'ProcessTable': {
      const { processData } = props.args;
      return(
        <ProcessDataContextProvider processData={processData}>
          <ProcessTable />
          <EditCommandModal />
        </ProcessDataContextProvider>
      );
    }

    default:
      return <p>Invalid component name</p>;
  }
}

export default withStreamlitConnection(App);
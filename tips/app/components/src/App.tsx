// StreamLit
import { withStreamlitConnection, ComponentProps } from 'streamlit-component-lib';

// Contexts
import SharedDataContextProvider from './components/reusable/contexts/SharedDataContext';

// Components
import ProcessTable from '@/components/ProcessTable/jsx/ProcessTable';
import EditCommandModal from '@/components/EditCommandModal/EditCommandModal';

// Interfaces
import { ProcessDataInterface } from '@/interfaces/Interfaces';

// CSS
import '../node_modules/react-tooltip/dist/react-tooltip.css' // CSS for default styling of react-tooltip components

interface PropsInterface_ProcessTable {
  instructions?: {
    resetSelectedCommand: boolean;
  }
  component: 'ProcessTable';
  processData: ProcessDataInterface;
}

interface PropsInterface_ProcessComandsModal {
  component: 'ProcessCommandsModal';
  processData: ProcessDataInterface;
  selectedProcessId: number;
  selectedCommandId: number;
}

interface ComponentPropsWithArgs extends ComponentProps {
  args: PropsInterface_ProcessTable | PropsInterface_ProcessComandsModal;
}

function App(props: ComponentPropsWithArgs) {
  const { component } = props.args;

  // Cannot use switch case statement because destructuring 'processData' from 'props.args' in both 'ProcessTable' and 'ProcessCommandsModal' cases causes an error: "Cannot redeclare block-scoped variable"
  if(component === 'ProcessTable') {
    const { instructions, processData } = props.args;
      return(
        <SharedDataContextProvider instructions={instructions} processData={processData}>
          <ProcessTable />
        </SharedDataContextProvider>
      );
  }
  else if(component === 'ProcessCommandsModal') {
    const { processData, selectedProcessId, selectedCommandId } = props.args;
      return(
        <SharedDataContextProvider processData={processData} selectedProcessId={selectedProcessId} selectedCommandId={selectedCommandId}>
          <EditCommandModal />
        </SharedDataContextProvider>
      );
  }
  else {
    return <p>Invalid component name</p>;
  }
}

export default withStreamlitConnection(App);
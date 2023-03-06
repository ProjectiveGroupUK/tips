// StreamLit
import { withStreamlitConnection, ComponentProps } from 'streamlit-component-lib';

// Contexts
import SharedDataContextProvider from './components/reusable/contexts/SharedDataContext';

// Components
import ProcessTable from '@/components/ProcessTable/jsx/ProcessTable';
import EditCommandModal from '@/components/EditCommandModal/EditCommandModal';

// Interfaces
import { ProcessDataInterface } from '@/interfaces/Interfaces';
import { UpdateCommandInterface, CreateCommandInterface } from '@/components/reusable/contexts/SharedDataContext';

// CSS
import '../node_modules/react-tooltip/dist/react-tooltip.css' // CSS for default styling of react-tooltip components

interface PropsInterface_ProcessTable {
  component: 'ProcessTable';
  processData: ProcessDataInterface;
  instructions: {
    resetCreateCommand: boolean;
    resetSelectedCommand: boolean;
  }
}

interface PropsInterface_EditCommandModal {
  component: 'EditCommandModal';
  processData: ProcessDataInterface;
  updateCommand: UpdateCommandInterface;
  instructions: {
    editCommandExecutionSucceeded: boolean;
    editCommandExecutionFailed: boolean;
  }
}

interface PropsInterface_CreateCommandModal {
  component: 'CreateCommandModal';
  createCommand: CreateCommandInterface;
  instructions: {
    createCommandExecutionSucceeded: boolean;
    createCommandExecutionFailed: boolean;
  }
}

interface ComponentPropsWithArgs extends ComponentProps {
  args: PropsInterface_ProcessTable | /*PropsInterface_ProcessCommandsModal | */PropsInterface_CreateCommandModal | PropsInterface_EditCommandModal;
}

function App(props: ComponentPropsWithArgs) {
  const { component } = props.args;

  // Cannot use switch case statement because destructuring 'processData' from 'props.args' in both 'ProcessTable' and 'ProcessCommandsModal' cases causes an error: "Cannot redeclare block-scoped variable"
  if(component === 'ProcessTable') {
    const { instructions, processData } = props.args;
    return(
      <SharedDataContextProvider component={component} instructions={instructions} processData={processData}>
        <ProcessTable />
      </SharedDataContextProvider>
    );
  }
  else if (component === 'EditCommandModal') {
    const { processData, updateCommand, instructions } = props.args;
    return(
      <SharedDataContextProvider component={component} processData={processData} updateCommand={updateCommand} instructions={instructions}>
        <EditCommandModal />
      </SharedDataContextProvider>
    );
  }
  else if(component === 'CreateCommandModal') {
    const { createCommand, instructions } = props.args;
    return(
      <SharedDataContextProvider component={component} createCommand={createCommand} instructions={instructions}>
        <EditCommandModal />
      </SharedDataContextProvider>
    );
  }
  else {
    return <p>Invalid component name</p>;
  }
}

export default withStreamlitConnection(App);
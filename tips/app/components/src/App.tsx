// StreamLit
import { withStreamlitConnection, ComponentProps } from 'streamlit-component-lib';

// Contexts
import ProcessTableDataContextProvider from './components/reusable/contexts/ProcessTableDataContext';
import CommandModalDataContextProvider from './components/reusable/contexts/CommandModalDataContext';

// Components
import ProcessTable from '@/components/ProcessTable/jsx/ProcessTable';
import EditCommandModal from '@/components/EditCommandModal/EditCommandModal';

// Interfaces
import { ProcessDataInterface, CommandDataInterface } from '@/interfaces/Interfaces';

// Enums
import { ExecutionStatus } from './enums/enums';

// CSS
import '../node_modules/react-tooltip/dist/react-tooltip.css' // CSS for default styling of react-tooltip components

export interface PropsInterface_ProcessTable {
  component: 'ProcessTable';
  processData: ProcessDataInterface;
  instructions: {
    resetCreateCommand: boolean;
    resetSelectedCommand: boolean;
  }
}

export interface PropsInterface_CommandModal {
  component: 'CommandModal';
  commandData: {
    operation: {
      type: 'create' | 'edit';
    }
    process: ProcessDataInterface[0];
    command: Partial<CommandDataInterface> | null;
    executionStatus: {
      status: ExecutionStatus;
      createdCommandId?: number | undefined;
    };
  },
  instructions: {
    commandExecutionStatus: ExecutionStatus;
  }
}

interface ComponentPropsWithArgs extends ComponentProps {
  args: PropsInterface_ProcessTable | PropsInterface_CommandModal;
}

function App(props: ComponentPropsWithArgs) {
  const { component } = props.args;

  switch (component) {
    case 'ProcessTable':
      return (
        <ProcessTableDataContextProvider {...props.args}>
          <ProcessTable />
        </ProcessTableDataContextProvider>
      );

    case 'CommandModal':
      return (
        <CommandModalDataContextProvider {...props.args}>
          <EditCommandModal />
        </CommandModalDataContextProvider>
      );

      default:
        return <p>Invalid component name</p>;
  }
}

export default withStreamlitConnection(App);
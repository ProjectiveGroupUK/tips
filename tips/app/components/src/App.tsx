// StreamLit
import { withStreamlitConnection, ComponentProps } from 'streamlit-component-lib';

// Contexts
import ProcessTableDataContextProvider from '@/contexts/ProcessTableDataContext';
import ProcessModalDataContextProvider from '@/contexts/ProcessModalDataContex';
import CommandModalDataContextProvider from '@/contexts/CommandModalDataContext';
import DQTableDataContextProvider from '@/contexts/DQTableDataContext';
import DQModalDataContextProvider from '@/contexts/DQModalDataContext';
import DQTargetModalDataContextProvider from '@/contexts/DQTargetModalDataContext';

// Components
import ProcessTable from '@/components/ProcessTable/ProcessTable';
import ProcessModal from './components/ProcessModal/ProcessModal';
import CommandModal from '@/components/CommandModal/CommandModal';
import DQTable from '@/components/DQTable/DQTable';
import DQModal from '@/components/DQModal/DQModal';
import DQTargetModal from '@/components/DQTargetModal/DQTargetModal';

// Interfaces
import { ProcessDataInterface, CommandDataInterface, ExecutionStatusInterface, DQDataInterface, DQTargetDataInterface } from '@/interfaces/Interfaces';

// Enums
import { OperationType } from '@/enums/enums';

interface ComponentPropsWithArgs extends ComponentProps {
  args: PropsInterface_ProcessTable | PropsInterface_ProcessModal | PropsInterface_CommandModal | PropsInterface_DQTable | PropsInterface_DQModal | PropsInterface_DQTargetModal;
}

export interface PropsInterface_ProcessTable {
  component: 'ProcessTable';
  processData: ProcessDataInterface[];
  instructions: {
    resetProcessTableProcess: boolean;
    resetProcessTableCommand: boolean;
  }
}

export interface PropsInterface_ProcessModal {
  component: 'ProcessModal';
  process: {
    operation: {
      type: OperationType;
    }
    process: ProcessDataInterface;
  }
  instructions: {
    processExecutionStatus: ExecutionStatusInterface;
  }
}

export interface PropsInterface_CommandModal {
  component: 'CommandModal';
  commandData: {
    operation: {
      type: OperationType;
    }
    process: ProcessDataInterface;
    command: Partial<CommandDataInterface> | null;
  },
  instructions: {
    commandExecutionStatus: ExecutionStatusInterface;
  }
}

export interface PropsInterface_DQTable {
  component: 'DQTable';
  dqdata: DQDataInterface[];
  instructions: {
    resetDQTableDQTest: boolean;
    resetDQTableTarget: boolean;
  }
}

export interface PropsInterface_DQModal {
  component: 'DQModal';
  dqdata: {
    operation: {
      type: OperationType;
    }
    dqdata: DQDataInterface;
  }
  instructions: {
    dqExecutionStatus: ExecutionStatusInterface;
  }
}

export interface PropsInterface_DQTargetModal {
  component: 'DQTargetModal';
  dqtargetdata: {
    operation: {
      type: OperationType;
    }
    dqdata: DQDataInterface;
    dqtarget: Partial<DQTargetDataInterface> | null;
  },
  instructions: {
    dqTargetExecutionStatus: ExecutionStatusInterface;
  }
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

    case 'ProcessModal':
      return (
        <ProcessModalDataContextProvider {...props.args}>
          <ProcessModal />
        </ProcessModalDataContextProvider>
      );

    case 'CommandModal':
      return (
        <CommandModalDataContextProvider {...props.args}>
          <CommandModal />
        </CommandModalDataContextProvider>
      );

    case 'DQTable':
      return (
        <DQTableDataContextProvider {...props.args}>
          <DQTable />
        </DQTableDataContextProvider>
      );

    case 'DQModal':
      return (
        <DQModalDataContextProvider {...props.args}>
          <DQModal />
        </DQModalDataContextProvider>
      );

    case 'DQTargetModal':
      return (
        <DQTargetModalDataContextProvider {...props.args}>
          <DQTargetModal />
        </DQTargetModalDataContextProvider>
      );

    default:
      return <p>Invalid component name</p>;
  }
}

export default withStreamlitConnection(App);
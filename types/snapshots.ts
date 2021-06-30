import type { NodeData, PositionData, AttributeData, TextData } from '../vendor/mutation-summary';

export interface Snapshot {
  type: 'initialize' | 'applyChanged';
  args: SnapshotInitializeArgs | SnapshotApplyChangedArgs;
}

type SnapshotInitializeArgs = [number, NodeData[]];

type SnapshotApplyChangedArgs = [NodeData[], PositionData[], AttributeData[], TextData[]];
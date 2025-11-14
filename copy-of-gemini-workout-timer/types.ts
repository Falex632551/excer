
export interface Exercise {
  id: string;
  name: string;
  duration: number; // in seconds
}

export interface WorkoutProgram {
  id: string;
  name: string;
  exercises: Exercise[];
  restBetweenExercises: number; // in seconds
  restBetweenSets: number; // in seconds
  sets: number;
}

export type View = 'PROGRAM_LIST' | 'PROGRAM_EDITOR' | 'WORKOUT_TIMER';

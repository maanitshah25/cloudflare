import React from 'react';
import { createRoot } from 'react-dom/client';
import FeedbackAnalyzer from './FeedbackAnalyzer';

const root = createRoot(document.getElementById('root')!);
root.render(<FeedbackAnalyzer />);

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { analyticsAPI } from '../services/api';
import { StatsCard } from '../components/productivity/StatsCard';
import { LoadingSpinner, EmptyState } from '../components/shared/LoadingStates';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/shared/Button';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToast } = useUIStore();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadStats();
  }, [isAuthenticated, navigate]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const response = await analyticsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      addToast(
        error.response?.data?.message || 'Failed to load stats',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-text-secondary">
            Your workspace productivity insights
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate('/workspace')}
            className="mt-4"
          >
            ← Back to Workspace
          </Button>
        </div>

        {/* Stats Grid */}
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              icon="⏱️"
              title="Total Hours"
              value={stats.totalHours?.toFixed(1) || '0'}
              trend={{ value: 12, label: 'vs last week' }}
            />
            <StatsCard
              icon="📋"
              title="Tasks Completed"
              value={stats.tasksCompleted || '0'}
              color="success"
            />
            <StatsCard
              icon="👥"
              title="Interactions"
              value={stats.interactionCount || '0'}
              color="primary"
            />
            <StatsCard
              icon="🎯"
              title="Focus Score"
              value={`${stats.focusScore || 0}%`}
              color="highlight"
            />
          </div>
        ) : (
          <EmptyState
            icon="📊"
            title="No data available"
            description="Start working to see analytics"
          />
        )}

        {/* Charts Section */}
        <motion.div
          className="glass bg-bg-secondary p-6 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Weekly Summary
          </h2>
          <p className="text-text-secondary">
            Charts and detailed analytics coming soon...
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

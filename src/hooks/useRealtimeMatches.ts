import { useEffect, useState, useCallback, useRef } from "react";
import { getRealtimeManager, destroyRealtimeManager, type RealtimeMatchUpdate } from "@/utils/supabaseRealtime";

export function useRealtimeMatches(matchIds: string[] = []) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<RealtimeMatchUpdate | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const managerRef = useRef<ReturnType<typeof getRealtimeManager> | null>(null);

  const subscribe = useCallback(async () => {
    try {
      const manager = getRealtimeManager({
        onMatchUpdate: (match) => {
          setLastUpdate(match);
          setError(null);
        },
        onMatchInserted: (match) => {
          setLastUpdate(match);
          setError(null);
        },
        onMatchDeleted: (matchId) => {
          console.log("Match deleted:", matchId);
        },
        onError: (err) => {
          setError(err);
        },
        onConnectionChange: (connected) => {
          setIsConnected(connected);
        },
      });

      managerRef.current = manager;

      if (matchIds.length > 0) {
        await manager.subscribeToMatches(matchIds);
      } else {
        await manager.subscribeToAllMatches();
      }
    } catch (err) {
      setError(err as Error);
    }
  }, [matchIds]);

  const unsubscribe = useCallback(async () => {
    if (managerRef.current) {
      await managerRef.current.unsubscribe();
    }
  }, []);

  useEffect(() => {
    subscribe();

    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  const manualRefresh = useCallback(async () => {
    await unsubscribe();
    await subscribe();
  }, [unsubscribe, subscribe]);

  return {
    isConnected,
    lastUpdate,
    error,
    manualRefresh,
  };
}

export function useRealtimeMatch(matchId: string) {
  const [match, setMatch] = useState<RealtimeMatchUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const managerRef = useRef<ReturnType<typeof getRealtimeManager> | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const manager = getRealtimeManager({
      onMatchUpdate: (updatedMatch) => {
        if (updatedMatch.id === matchId) {
          setMatch(updatedMatch);
          setError(null);
        }
      },
      onMatchInserted: (newMatch) => {
        if (newMatch.id === matchId) {
          setMatch(newMatch);
          setError(null);
        }
      },
      onMatchDeleted: (deletedId) => {
        if (deletedId === matchId) {
          setMatch(null);
        }
      },
      onError: (err) => {
        setError(err);
      },
      onConnectionChange: (connected) => {
        setIsConnected(connected);
      },
    });

    managerRef.current = manager;
    manager.subscribeToMatches([matchId]);

    return () => {
      manager.unsubscribe();
    };
  }, [matchId]);

  return {
    match,
    isConnected,
    error,
  };
}

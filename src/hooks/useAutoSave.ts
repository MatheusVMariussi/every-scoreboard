import { useEffect, useRef } from 'react';
import { saveData } from '../utils/storage';

/**
 * Grava `snapshot` em `key` sempre que ele muda, mas só depois que o save foi carregado.
 *
 * Duas gravações ficam de fora de propósito:
 * - Antes do load terminar: o estado ainda é o padrão, e gravá-lo apagaria o save.
 * - A primeira depois do load: ela só regravaria o que acabou de ser lido. E se a leitura
 *   falhou (`getData` devolve `null` tanto para "nada salvo" quanto para erro), o estado é
 *   o padrão — gravar agora apagaria um save que continua inteiro no disco.
 *
 * `snapshot` precisa manter a identidade entre renders quando nada mudou (`useMemo`), ou
 * cada render vira uma gravação.
 */
export const useAutoSave = (key: string, snapshot: unknown, isLoaded: boolean): void => {
  const hasSkippedLoadedState = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!hasSkippedLoadedState.current) {
      hasSkippedLoadedState.current = true;
      return;
    }
    void saveData(key, snapshot);
  }, [key, snapshot, isLoaded]);
};

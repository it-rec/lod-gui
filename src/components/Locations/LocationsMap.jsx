import { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { autoLayout } from './mapLayout';
import styles from './LocationsMap.module.scss';

const STATUS_LABEL = {
  rumored: 'Rumored',
  visited: 'Visited',
  home:    'Home',
  lost:    'Lost',
};

const clamp01 = (n) => Math.max(0, Math.min(100, n));

// A hand-drawn map view of the Locations list. Each entry is a pin
// positioned at its persisted {x, y} (0..100 percent of the canvas);
// entries without coords get an auto-laid-out grid position. Dragging a
// pin updates the persisted coords; clicking opens a small detail
// popover.
const LocationsMap = ({ locations, onMove }) => {
  const surfaceRef = useRef(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const [openId, setOpenId] = useState(null);
  const [drag, setDrag] = useState(null);

  // Stable map of id -> {x, y}, filling in defaults for any entry that
  // hasn't been positioned yet.
  const positions = autoLayout(locations);

  // Pointer-driven drag. We track via window listeners so a fast pointer
  // that leaves the pin during the drag keeps following.
  useEffect(() => {
    if (!drag) return undefined;
    const handlePointerMove = (event) => {
      const surface = surfaceRef.current;
      if (!surface) return;
      const r = surface.getBoundingClientRect();
      const x = clamp01(((event.clientX - r.left) / r.width) * 100);
      const y = clamp01(((event.clientY - r.top) / r.height) * 100);
      setDrag((current) => (current ? { ...current, x, y, moved: true } : null));
    };
    const handlePointerUp = () => {
      setDrag((current) => {
        if (current && current.moved && onMoveRef.current) {
          onMoveRef.current({ id: current.id, x: current.x, y: current.y });
        }
        return null;
      });
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [drag?.id]);

  const startDrag = (event, location) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const pos = positions[location.id] || { x: 50, y: 50 };
    setDrag({ id: location.id, x: pos.x, y: pos.y, moved: false });
  };

  if (!locations.length) {
    return (
      <p className={styles.empty}>
        Mark a place first — the map will sketch it in.
      </p>
    );
  }

  const openLocation = openId
    ? locations.find((l) => l.id === openId)
    : null;
  const openPos = openId ? positions[openId] : null;

  return (
    <div
      className={styles.surface}
      ref={surfaceRef}
      onClick={() => setOpenId(null)}
      data-testid="locations-map-surface"
    >
      <div className={styles.parchment} aria-hidden="true" />
      <div className={styles.compass} aria-hidden="true">N</div>
      {locations.map((location) => {
        const pos = drag && drag.id === location.id
          ? { x: drag.x, y: drag.y }
          : positions[location.id] || { x: 50, y: 50 };
        const isDragging = drag?.id === location.id && drag.moved;
        return (
          <button
            key={location.id}
            type="button"
            className={cx(
              styles.pin,
              styles[`pin-${location.status}`],
              { [styles.pinDragging]: isDragging }
            )}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onPointerDown={(event) => startDrag(event, location)}
            onClick={(event) => {
              event.stopPropagation();
              if (!isDragging) setOpenId((id) => (id === location.id ? null : location.id));
            }}
            aria-label={`${location.name}, ${STATUS_LABEL[location.status]} — drag to reposition`}
            title={location.name}
            data-testid={`pin-${location.id}`}
          >
            <span className={styles.pinDot} aria-hidden="true" />
            <span className={styles.pinLabel}>{location.name}</span>
          </button>
        );
      })}
      {openLocation && openPos && (
        <div
          role="dialog"
          aria-label={`${openLocation.name} details`}
          className={cx(styles.popover, {
            [styles.popoverFlip]: openPos.y > 60,
            [styles.popoverFlipX]: openPos.x > 70,
          })}
          style={{ left: `${openPos.x}%`, top: `${openPos.y}%` }}
          onClick={(event) => event.stopPropagation()}
        >
          <p className={styles.popoverName}>{openLocation.name}</p>
          <p className={styles.popoverMeta}>
            <span className={cx(styles.popoverStatus, styles[`popoverStatus-${openLocation.status}`])}>
              {STATUS_LABEL[openLocation.status]}
            </span>
            {openLocation.region && (
              <>
                <span aria-hidden="true"> · </span>
                <span>{openLocation.region}</span>
              </>
            )}
          </p>
          {openLocation.notes && (
            <p className={styles.popoverNotes}>{openLocation.notes}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationsMap;

import { useState } from 'react';
import cx from 'classnames';
import TextInput from '../common/TextInput/TextInput';
import Button from '../common/Button/Button';
import Stepper from '../common/Stepper/Stepper';
import StaminaBar from './StaminaBar';
import { IconChevron, IconTrash, IconPlus } from '../common/icons';
import styles from './HeroCard.module.scss';

const SkillEditor = ({ skills, onChange }) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const skill = draft.trim();
    if (skill && !skills.includes(skill)) onChange([...skills, skill]);
    setDraft('');
  };

  return (
    <div className={styles.skills}>
      {skills.length > 0 && (
        <ul className={styles.chips}>
          {skills.map((skill) => (
            <li key={skill} className={styles.chip}>
              <span>{skill}</span>
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => onChange(skills.filter((entry) => entry !== skill))}
                aria-label={`Remove ${skill}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.skillAdd}>
        <TextInput
          variant="sm"
          value={draft}
          placeholder="Add a skill or proficiency…"
          aria-label="New skill"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button kind="ghost" size="sm" iconOnly onClick={add} aria-label="Add skill">
          <IconPlus />
        </Button>
      </div>
    </div>
  );
};

const ItemList = ({ items, onChange }) => {
  const updateItem = (index, patch) =>
    onChange(items.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));

  return (
    <div className={styles.items}>
      {items.map((item, index) => (
        <div key={index} className={styles.itemRow}>
          <TextInput
            variant="sm"
            value={item.name}
            placeholder="Item name"
            aria-label="Item name"
            onChange={(event) => updateItem(index, { name: event.target.value })}
          />
          <Stepper
            value={item.amount}
            min={0}
            max={999}
            label="item quantity"
            onChange={(amount) => updateItem(index, { amount })}
          />
          <Button
            kind="danger"
            size="sm"
            iconOnly
            onClick={() => onChange(items.filter((_, idx) => idx !== index))}
            aria-label="Remove item"
          >
            <IconTrash />
          </Button>
        </div>
      ))}
      <Button
        kind="ghost"
        size="sm"
        onClick={() => onChange([...items, { name: '', amount: 1 }])}
      >
        <IconPlus />
        Add item
      </Button>
    </div>
  );
};

// A single hero's card: identity and vitality are always visible; the full
// character sheet (level, skills, inventory, notes) lives in the details.
const HeroCard = ({ hero, onChange, onRemove, canRemove }) => {
  const [expanded, setExpanded] = useState(false);
  const update = (patch) => onChange({ ...hero, ...patch });

  const initial = (hero.name.trim()[0] || '?').toUpperCase();

  return (
    <article className={cx(styles.card, { [styles.open]: expanded })}>
      <div className={styles.main}>
        <div className={styles.avatar} aria-hidden="true">
          {initial}
        </div>
        <div className={styles.identity}>
          <TextInput
            variant="lg"
            value={hero.name}
            placeholder="Unnamed hero"
            aria-label="Hero name"
            onChange={(event) => update({ name: event.target.value })}
          />
          <div className={styles.lineage}>
            <TextInput
              variant="sm"
              list="lod-races"
              value={hero.race}
              placeholder="Race"
              aria-label="Race"
              onChange={(event) => update({ race: event.target.value })}
            />
            <TextInput
              variant="sm"
              list="lod-classes"
              value={hero.class}
              placeholder="Class"
              aria-label="Class"
              onChange={(event) => update({ class: event.target.value })}
            />
          </div>
        </div>
        <div className={styles.level} title="Level">
          <span className={styles.levelWord}>Lvl</span>
          <span className={styles.levelNum}>{hero.level}</span>
        </div>
      </div>

      <StaminaBar
        current={hero.stamina.current}
        max={hero.stamina.max}
        onChange={(stamina) => update({ stamina })}
      />

      <button
        type="button"
        className={styles.toggle}
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <span>{expanded ? 'Hide character sheet' : 'Open character sheet'}</span>
        <IconChevron className={cx(styles.chevron, { [styles.chevronUp]: expanded })} />
      </button>

      {expanded && (
        <div className={styles.details}>
          <div className={styles.statRow}>
            <label className={styles.stat}>
              <span className={styles.statLabel}>Level</span>
              <Stepper
                value={hero.level}
                min={1}
                max={30}
                label="level"
                onChange={(level) => update({ level })}
              />
            </label>
            <label className={styles.stat}>
              <span className={styles.statLabel}>Max vitality</span>
              <Stepper
                value={hero.stamina.max}
                min={1}
                max={99}
                label="max vitality"
                onChange={(max) =>
                  update({
                    stamina: {
                      max,
                      current: Math.min(hero.stamina.current, max),
                    },
                  })
                }
              />
            </label>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Skills & proficiencies</span>
            <SkillEditor
              skills={hero.skills}
              onChange={(skills) => update({ skills })}
            />
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Inventory</span>
            <ItemList items={hero.items} onChange={(items) => update({ items })} />
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Notes</span>
            <textarea
              className={styles.notes}
              value={hero.notes}
              placeholder="Background, bonds, scars, secrets…"
              rows={3}
              onChange={(event) => update({ notes: event.target.value })}
            />
          </div>

          <div className={styles.cardFooter}>
            <Button
              kind="danger"
              size="sm"
              disabled={!canRemove}
              onClick={onRemove}
            >
              <IconTrash />
              Remove hero
            </Button>
          </div>
        </div>
      )}
    </article>
  );
};

export default HeroCard;

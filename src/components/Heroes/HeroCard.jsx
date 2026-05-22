import { useState } from 'react';
import cx from 'classnames';
import TextInput from '../common/TextInput/TextInput';
import Button from '../common/Button/Button';
import Stepper from '../common/Stepper/Stepper';
import ChipEditor from '../common/ChipEditor/ChipEditor';
import RankDots from '../common/RankDots/RankDots';
import StaminaBar from './StaminaBar';
import { IconChevron, IconTrash, IconPlus } from '../common/icons';
import { MAX_SKILL_RANK } from '../character';
import styles from './HeroCard.module.scss';

const SkillEditor = ({ skills, onChange }) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const name = draft.trim();
    const exists = skills.some(
      (skill) => skill.name.toLowerCase() === name.toLowerCase()
    );
    if (name && !exists) onChange([...skills, { name, rank: 1 }]);
    setDraft('');
  };

  return (
    <div className={styles.skills}>
      {skills.length > 0 && (
        <ul className={styles.skillList}>
          {skills.map((skill, index) => (
            <li key={skill.name} className={styles.skillRow}>
              <span className={styles.skillName}>{skill.name}</span>
              <RankDots
                value={skill.rank}
                max={MAX_SKILL_RANK}
                label={`${skill.name} rank`}
                onChange={(rank) =>
                  onChange(
                    skills.map((entry, idx) =>
                      idx === index ? { ...entry, rank } : entry
                    )
                  )
                }
              />
              <Button
                kind="danger"
                size="sm"
                iconOnly
                aria-label={`Remove ${skill.name}`}
                onClick={() => onChange(skills.filter((_, idx) => idx !== index))}
              >
                <IconTrash />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.skillAdd}>
        <TextInput
          variant="sm"
          list="lod-skills"
          value={draft}
          placeholder="Add a skill…"
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

// A single character's card: identity, conditions and stamina are always
// visible; the full sheet (skills, traits, inventory, notes) lives in details.
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
              list="lod-species"
              value={hero.species}
              placeholder="Species"
              aria-label="Species"
              onChange={(event) => update({ species: event.target.value })}
            />
            <TextInput
              variant="sm"
              list="lod-backgrounds"
              value={hero.background}
              placeholder="Background"
              aria-label="Background"
              onChange={(event) => update({ background: event.target.value })}
            />
          </div>
        </div>
      </div>

      {hero.conditions.length > 0 && (
        <ul className={styles.conditionTags} aria-label="Active conditions">
          {hero.conditions.map((condition) => (
            <li key={condition} className={styles.conditionTag}>
              {condition}
            </li>
          ))}
        </ul>
      )}

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
          <label className={styles.stat}>
            <span className={styles.statLabel}>Max stamina</span>
            <Stepper
              value={hero.stamina.max}
              min={1}
              max={99}
              label="max stamina"
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

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Skills</span>
            <SkillEditor
              skills={hero.skills}
              onChange={(skills) => update({ skills })}
            />
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Traits</span>
            <ChipEditor
              values={hero.traits}
              placeholder="Add a trait…"
              ariaLabel="New trait"
              onChange={(traits) => update({ traits })}
            />
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Conditions</span>
            <ChipEditor
              values={hero.conditions}
              tone="warning"
              placeholder="Add a condition…"
              ariaLabel="New condition"
              onChange={(conditions) => update({ conditions })}
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
            <Button kind="danger" size="sm" disabled={!canRemove} onClick={onRemove}>
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

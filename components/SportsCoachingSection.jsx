
import React from 'react';
import './SportsCoaching.css';
const sports = [
  { num: '01', color: 'blue',   icon: 'ti-run',              name: 'Athletics',      },
  { num: '02', color: 'teal',   icon: 'ti-ball-volleyball',  name: 'Volleyball',      },
  { num: '03', color: 'coral',  icon: 'ti-users',            name: 'Kabaddi',        },
  { num: '04', color: 'purple', icon: 'ti-ball-basketball',  name: 'Basketball',      },
  { num: '05', color: 'amber',  icon: 'ti-cricket',          name: 'Cricket',         },
  { num: '06', color: 'teal',   icon: 'ti-ninja',            name: 'Kho-Kho',        },
  { num: '07', color: 'coral',  icon: 'ti-shield',           name: 'Self defence',    },
  { num: '08', color: 'purple', icon: 'ti-award',            name: 'Taekwondo',       },
  { num: '09', color: 'blue',   icon: 'ti-ripple',           name: 'Swimming',        },
  { num: '10', color: 'amber',  icon: 'ti-brand-snowflake',  name: 'Skating',         },
  { num: '11', color: 'teal',   icon: 'ti-target',           name: 'Archery',         },
  { num: '12', color: 'blue',   icon: 'ti-hand-stop',        name: 'Handball',        },
  { num: '13', color: 'purple', icon: 'ti-table-tennis',     name: 'Table Tennis',   },
  { num: '14', color: 'coral',  icon: 'ti-barbell',          name: 'Weightlifting',    },
  { num: '15', color: 'amber',  icon: 'ti-boxing',           name: 'Boxing',          },
];

const legendItems = [
  { color: '#378add', label: 'Aquatic & field' },
  { color: '#1d9e75', label: 'Team sports'     },
  { color: '#7f77dd', label: 'Martial arts'    },
  { color: '#d85a30', label: 'Combat'          },
  { color: '#ba7517', label: 'Precision'       },
];

export default function SportsCoachingSection() {
  return (
    <section id="coaching" className="sc-section">
      <div className="sc-container">

  
       <h2 className="section-title fade-in">Sports Coaching Offered</h2>
      <p className="text-center mb-5 fade-in">We provide certified coaches in the following disciplines</p>

        <div className="sc-grid">
          {sports.map(({ num, color, icon, name }) => (
            <div key={num} className={`sc-card sc-card--${color}`}>
              <span className="sc-card__num">{num}</span>
              <div className="sc-card__slab">
                <i className={`ti ${icon} sc-card__icon`} aria-hidden="true" />
              </div>
              <div className="sc-card__body">
                <p>{name}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="sc-legend">
          {legendItems.map(({ color, label }) => (
            <div key={label} className="sc-legend__pill">
              <span className="sc-legend__dot" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
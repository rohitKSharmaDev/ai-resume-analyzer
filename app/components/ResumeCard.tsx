import React from 'react'
import { Link } from 'react-router'
import ScoreCircle from './ScoreCircle'

const ResumeCard = ({ resume : { id, companyName, jobTitle, feedback, imagePath} } : { resume: Resume }) => {
  return (
    <Link to={`/resume/${id}`} className='resume-card animate-in fade-in duration-500'>
      <div className='resume-card-header'>
        <div className='flex flex-col gap-2'>
          <h2 className='!text-black font-bold break-words'>
            {companyName ? companyName : 'Unknown Company'}
          </h2>
          <h3 className='text-lg break-words text-gray-500'>
            {jobTitle ? jobTitle : 'Unknown Position'}
          </h3>
        </div>
        <div className='flex-shrink-0'>
          <ScoreCircle score={feedback?.overallScore ?? 0} />
        </div>
      </div>
      <div className='gradient-border animate-in fade-in duration-500'>
        <div className='w-full h-full'>
          <img src={imagePath} alt={`${jobTitle} ${companyName}`} className='w-full h-[350px] max-sm:h-[200px] object-cover object-top' />
        </div>
      </div>
    </Link>
  )
}

export default ResumeCard
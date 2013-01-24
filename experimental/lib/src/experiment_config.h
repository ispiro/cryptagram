#ifndef _EXPERIMENT_CONFIG_H_
#define _EXPERIMENT_CONFIG_H_

#define SIXTEEN_DISCRETIZATIONS
// #define EIGHT_DISCRETIZATIONS 1
// #define FOUR_DISCRETIZATIONS 1
#define TWO_BY_TWO


#ifdef TWO_BY_TWO
#define NUM_BLOCKS_PER_MATRIX 16
#endif

#ifdef SIXTEEN_DISCRETIZATIONS
#define NUM_DISCRETIZATIONS 16
#define BITS_PER_MATRIX 64
#define BITS_PER_VALUE 4
#define THRESHOLD 8
#endif  // SIXTEEN_DISCRETIZATIONS

#ifdef EIGHT_DISCRETIZATIONS
#define NUM_DISCRETIZATIONS 8
#define BITS_PER_MATRIX 48
#define BITS_PER_VALUE 3
#define THRESHOLD 16
#endif  // EIGHT_DISCRETIZATIONS

#ifdef FOUR_DISCRETIZATIONS
#define NUM_DISCRETIZATIONS 4
#define BITS_PER_MATRIX 32
#define BITS_PER_VALUE 2
#define THRESHOLD 32
#endif  // FOUR_DISCRETIZATIONS

#endif // _EXPERIMENT_CONFIG_H_